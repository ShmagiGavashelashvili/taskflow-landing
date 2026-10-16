import { describe, expect, it } from "vitest";
import { createTestApi, setupTestContainer } from "@/tests/api";
import { GET as getSession } from "../session/route";
import { POST } from "./route";

const NOW = new Date("2026-10-16T12:00:00.000Z");

setupTestContainer({ now: NOW });

const valid = {
  name: "Sam Rivera",
  email: "Sam@Example.com",
  password: "correct horse",
  workspaceName: "Rivera Labs",
};

describe("POST /api/auth/register", () => {
  it("creates the user and a workspace on a 14-day Pro trial, owned by them", async () => {
    const res = await createTestApi().request(POST, "/api/auth/register", { body: valid });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      user: { name: "Sam Rivera", email: "sam@example.com" },
      workspace: { name: "Rivera Labs", plan: "pro", billingPeriod: "monthly", trialEndsAt: "2026-10-30T12:00:00.000Z" },
      role: "owner",
    });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("starts the trial on the chosen plan", async () => {
    const res = await createTestApi().request(POST, "/api/auth/register", { body: { ...valid, plan: "business" } });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ workspace: { plan: "business", trialEndsAt: "2026-10-30T12:00:00.000Z" } });
  });

  it("gives a Free workspace no trial", async () => {
    const res = await createTestApi().request(POST, "/api/auth/register", { body: { ...valid, plan: "free" } });

    expect(res.body).toMatchObject({ workspace: { plan: "free", trialEndsAt: null } });
  });

  it("logs the new user in with an httpOnly 30-day session cookie", async () => {
    const api = createTestApi();
    const res = await api.request(POST, "/api/auth/register", { body: valid });

    const cookie = res.setCookies.find((c) => c.startsWith("tf_session="));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=2592000/);

    const session = await api.request(getSession, "/api/auth/session");
    expect(session.status).toBe(200);
    expect(session.body).toMatchObject({ user: { email: "sam@example.com" }, role: "owner" });
  });

  it("reports every invalid field", async () => {
    const res = await createTestApi().request(POST, "/api/auth/register", {
      body: { name: " ", email: "not-an-email", password: "short", workspaceName: "" },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: expect.any(String),
        fieldErrors: {
          name: [expect.any(String)],
          email: [expect.any(String)],
          password: ["Password must be at least 8 characters."],
          workspaceName: [expect.any(String)],
        },
      },
    });
    expect(res.setCookies).toEqual([]);
  });

  it("rejects an email that is already registered, whatever its case, with 409", async () => {
    const res = await createTestApi().request(POST, "/api/auth/register", {
      body: { ...valid, email: "DEMO@taskflow.app" },
    });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: { code: "EMAIL_TAKEN", fieldErrors: { email: [expect.any(String)] } } });
    expect(res.setCookies).toEqual([]);
  });
});
