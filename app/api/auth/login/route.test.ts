import { describe, expect, it } from "vitest";
import { createTestApi, logIn, setupTestContainer } from "@/tests/api";
import { POST as logout, GET as logoutRedirect } from "../logout/route";
import { POST as register } from "../register/route";
import { GET as getSession } from "../session/route";
import { POST } from "./route";

const container = setupTestContainer();

describe("POST /api/auth/login", () => {
  it("logs in the seeded demo owner, case-insensitively, and sets the session cookie", async () => {
    const api = createTestApi();
    const res = await api.request(POST, "/api/auth/login", {
      body: { email: "Demo@TaskFlow.app", password: "demo1234" },
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      user: { id: "usr_demo", name: "Alex Morgan", email: "demo@taskflow.app" },
      workspace: { id: "ws_acme", name: "Acme Studio" },
      role: "owner",
    });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
    expect(api.cookie("tf_session")).toEqual(expect.any(String));
  });

  it.each([
    ["a wrong password", { email: "demo@taskflow.app", password: "wrong-password" }],
    ["an unknown email", { email: "nobody@taskflow.app", password: "demo1234" }],
  ])("gives the same generic error for %s", async (_case, body) => {
    const res = await createTestApi().request(POST, "/api/auth/login", { body });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } });
    expect(res.setCookies).toEqual([]);
  });

  it("validates the fields", async () => {
    const res = await createTestApi().request(POST, "/api/auth/login", { body: { email: "", password: "" } });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { email: [expect.any(String)], password: [expect.any(String)] } },
    });
  });

  it("logs in a seeded member with their role", async () => {
    const api = createTestApi();
    await logIn(api, { email: "priya@acme.studio" });

    const session = await api.request(getSession, "/api/auth/session");
    expect(session.body).toMatchObject({ user: { id: "usr_priya" }, role: "member" });
  });
});

describe("GET /api/auth/session", () => {
  it("is 401 without a session", async () => {
    const res = await createTestApi().request(getSession, "/api/auth/session");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
  });

  it("is 401 and clears a tampered cookie", async () => {
    const api = createTestApi();
    await logIn(api);
    api.setCookie("tf_session", `${api.cookie("tf_session")}x`);

    const res = await api.request(getSession, "/api/auth/session");

    expect(res.status).toBe(401);
    expect(api.cookie("tf_session")).toBeUndefined();
  });

  it("treats a session whose user disappeared in a store reset as logged out", async () => {
    const api = createTestApi();
    await api.request(register, "/api/auth/register", {
      body: { name: "Sam", email: "sam@example.com", password: "correct horse", workspaceName: "Sam Co" },
    });
    expect((await api.request(getSession, "/api/auth/session")).status).toBe(200);

    container.reset(); // the in-memory store goes back to the seed, as it can on Vercel

    const res = await api.request(getSession, "/api/auth/session");
    expect(res.status).toBe(401);
    expect(res.setCookies.some((c) => /^tf_session=;/.test(c) && /Max-Age=0/.test(c))).toBe(true);
    expect(api.cookie("tf_session")).toBeUndefined();
  });

  it("keeps demo sessions working across a store reset", async () => {
    const api = createTestApi();
    await logIn(api);

    container.reset();

    expect((await api.request(getSession, "/api/auth/session")).status).toBe(200);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const api = createTestApi();
    await logIn(api);

    const res = await api.request(logout, "/api/auth/logout", { method: "POST" });

    expect(res.status).toBe(204);
    expect(api.cookie("tf_session")).toBeUndefined();
    expect((await api.request(getSession, "/api/auth/session")).status).toBe(401);
  });

  it("succeeds when already logged out", async () => {
    const res = await createTestApi().request(logout, "/api/auth/logout", { method: "POST" });

    expect(res.status).toBe(204);
  });
});

describe("GET /api/auth/logout", () => {
  // Server pages that find a stale session send the browser here, since they can't clear cookies.
  it("clears the cookie and redirects to login, keeping a safe return path", async () => {
    const api = createTestApi();
    await logIn(api);

    const res = await api.request(logoutRedirect, "/api/auth/logout?next=%2Fapp%2Fsettings%2Fprofile");

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fapp%2Fsettings%2Fprofile");
    expect(api.cookie("tf_session")).toBeUndefined();
  });

  it("ignores return paths that leave the site", async () => {
    const res = await createTestApi().request(logoutRedirect, "/api/auth/logout?next=%2F%2Fevil.example");

    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
