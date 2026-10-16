import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer } from "@/tests/api";
import { POST as login } from "../auth/login/route";
import { GET as getSession } from "../auth/session/route";
import { POST as changePassword } from "./password/route";
import { GET, PATCH } from "./route";

setupTestContainer();

describe("GET /api/me", () => {
  it("returns the signed-in user's profile without the password hash", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(GET, "/api/me");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "usr_demo", name: "Alex Morgan", email: "demo@taskflow.app", createdAt: expect.any(String) });
  });

  it("requires a session", async () => {
    const res = await createTestApi().request(GET, "/api/me");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
  });
});

describe("PATCH /api/me", () => {
  it("renames the user, and the session reflects it", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(PATCH, "/api/me", { method: "PATCH", body: { name: "  Alex M.  " } });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "usr_demo", name: "Alex M." });
    expect((await api.request(getSession, "/api/auth/session")).body).toMatchObject({ user: { name: "Alex M." } });
  });

  it("rejects an empty name", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(PATCH, "/api/me", { method: "PATCH", body: { name: "   " } });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { name: [expect.any(String)] } } });
  });

  it("requires a session", async () => {
    const res = await createTestApi().request(PATCH, "/api/me", { method: "PATCH", body: { name: "Hacker" } });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/me/password", () => {
  it("changes the password when the current one is right", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(changePassword, "/api/me/password", {
      body: { currentPassword: "demo1234", newPassword: "much better pass" },
    });
    expect(res.status).toBe(204);

    const fresh = createTestApi();
    expect(
      (await fresh.request(login, "/api/auth/login", { body: { email: "demo@taskflow.app", password: "demo1234" } })).status,
    ).toBe(401);
    expect(
      (await fresh.request(login, "/api/auth/login", { body: { email: "demo@taskflow.app", password: "much better pass" } }))
        .status,
    ).toBe(200);
  });

  it("keeps the current session logged in", async () => {
    const api = await createLoggedInApi();
    await api.request(changePassword, "/api/me/password", {
      body: { currentPassword: "demo1234", newPassword: "much better pass" },
    });

    expect((await api.request(getSession, "/api/auth/session")).status).toBe(200);
  });

  it("rejects a wrong current password against that field", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(changePassword, "/api/me/password", {
      body: { currentPassword: "not-it", newPassword: "much better pass" },
    });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { currentPassword: ["Your current password is incorrect."] } },
    });
  });

  it("enforces the new password rules", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(changePassword, "/api/me/password", {
      body: { currentPassword: "demo1234", newPassword: "short" },
    });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { fieldErrors: { newPassword: [expect.any(String)] } } });
  });

  it("requires a session", async () => {
    const res = await createTestApi().request(changePassword, "/api/me/password", {
      body: { currentPassword: "demo1234", newPassword: "much better pass" },
    });

    expect(res.status).toBe(401);
  });
});
