import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer } from "@/tests/api";
import { GET as getSession } from "../auth/session/route";
import { GET, PATCH } from "./route";

setupTestContainer();

const MEMBER = { email: "priya@acme.studio" };

describe("GET /api/workspace", () => {
  it("returns the current workspace to any member", async () => {
    const api = await createLoggedInApi(MEMBER);

    const res = await api.request(GET, "/api/workspace");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ workspace: { id: "ws_acme", name: "Acme Studio", plan: "pro" } });
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/workspace")).status).toBe(401);
  });
});

describe("PATCH /api/workspace", () => {
  it("lets the owner rename the workspace, and the session reflects it", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(PATCH, "/api/workspace", { method: "PATCH", body: { name: "  Acme Labs " } });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ workspace: { id: "ws_acme", name: "Acme Labs" } });
    expect((await api.request(getSession, "/api/auth/session")).body).toMatchObject({ workspace: { name: "Acme Labs" } });
  });

  it("forbids members from renaming it", async () => {
    const api = await createLoggedInApi(MEMBER);

    const res = await api.request(PATCH, "/api/workspace", { method: "PATCH", body: { name: "Priya's place" } });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "FORBIDDEN" } });
    expect((await api.request(GET, "/api/workspace")).body).toMatchObject({ workspace: { name: "Acme Studio" } });
  });

  it("rejects an empty name", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(PATCH, "/api/workspace", { method: "PATCH", body: { name: " " } });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { name: [expect.any(String)] } } });
  });
});
