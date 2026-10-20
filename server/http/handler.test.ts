import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { ErrorCode } from "@/lib/api/errors";
import { DomainError } from "@/server/domain/errors";
import { createTestApi, setupTestContainer } from "@/tests/api";
import { json, parseBody, parseQuery, route } from "./handler";

setupTestContainer();

const createThing = route(async (request) => {
  const body = await parseBody(request, z.object({ name: z.string().min(1), tags: z.array(z.string()).max(1) }));
  return json(body, { status: 201 });
});

const listThings = route(async (request) => {
  const query = parseQuery(request, z.object({ limit: z.coerce.number().int().max(50), tag: z.array(z.string()).optional() }));
  return json(query);
});

const failWith = (code: ErrorCode) =>
  route(async () => {
    throw new DomainError(code, `Failed with ${code}`);
  });

describe("route handler helpers", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps a DomainError from another copy of the module (Next bundles server code per layer)", async () => {
    vi.resetModules();
    const { DomainError: OtherCopy } = await import("@/server/domain/errors");
    expect(OtherCopy).not.toBe(DomainError);
    const failing = route(async () => {
      throw new OtherCopy("UNAVAILABLE", "Down for a moment.");
    });

    const res = await createTestApi().request(failing, "/api/things");

    expect(res).toMatchObject({ status: 503, body: { error: { code: "UNAVAILABLE", message: "Down for a moment." } } });
  });

  it("passes resolved params and returns the handler's response", async () => {
    const getThing = route<{ thingId: string }>(async (_request, { params }) => json({ id: params.thingId }));

    const res = await createTestApi().request(getThing, "/api/things/t1", { params: { thingId: "t1" } });

    expect(res).toMatchObject({ status: 200, body: { id: "t1" } });
  });

  it("returns the parsed body when it is valid", async () => {
    const res = await createTestApi().request(createThing, "/api/things", { body: { name: "Box", tags: ["a"] } });

    expect(res).toMatchObject({ status: 201, body: { name: "Box", tags: ["a"] } });
  });

  it("reports schema failures as 400 VALIDATION_ERROR with field errors", async () => {
    const res = await createTestApi().request(createThing, "/api/things", { body: { name: "", tags: ["a", "b"] } });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: expect.any(String),
        fieldErrors: { name: [expect.any(String)], tags: [expect.any(String)] },
      },
    });
  });

  it("reports a malformed JSON body as 400 VALIDATION_ERROR", async () => {
    const res = await createTestApi().request(createThing, "/api/things", { body: "{not json" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." } });
  });

  it("parses query strings, collecting repeated keys", async () => {
    const res = await createTestApi().request(listThings, "/api/things?limit=10&tag=a&tag=b");

    expect(res).toMatchObject({ status: 200, body: { limit: 10, tag: ["a", "b"] } });
  });

  it("reports invalid query strings as 400 VALIDATION_ERROR", async () => {
    const res = await createTestApi().request(listThings, "/api/things?limit=500");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { limit: [expect.any(String)] } } });
  });

  it.each<[ErrorCode, number]>([
    ["VALIDATION_ERROR", 400],
    ["INVALID_TOKEN", 400],
    ["UNAUTHENTICATED", 401],
    ["INVALID_CREDENTIALS", 401],
    ["FORBIDDEN", 403],
    ["PLAN_LIMIT_REACHED", 403],
    ["NOT_FOUND", 404],
    ["CONFLICT", 409],
    ["EMAIL_TAKEN", 409],
    ["UNAVAILABLE", 503],
  ])("maps the domain error %s to HTTP %i", async (code, status) => {
    const res = await createTestApi().request(failWith(code), "/api/things");

    expect(res.status).toBe(status);
    expect(res.body).toEqual({ error: { code, message: `Failed with ${code}` } });
  });

  it("hides unexpected errors behind a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const crash = route(async () => {
      throw new Error("database password is hunter2");
    });

    const res = await createTestApi().request(crash, "/api/things");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } });
  });
});

describe("isDomainError", () => {
  it("matches by code, including errors from another copy of the module", async () => {
    vi.resetModules();
    const { DomainError: OtherCopy } = await import("@/server/domain/errors");
    const { isDomainError } = await import("@/server/domain/errors");
    const error = new OtherCopy("PLAN_LIMIT_REACHED", "Upgrade.");
    expect(isDomainError(error)).toBe(true);
    expect(isDomainError(error, "PLAN_LIMIT_REACHED")).toBe(true);
    expect(isDomainError(error, "NOT_FOUND")).toBe(false);
    expect(isDomainError(new Error("nope"))).toBe(false);
  });
});
