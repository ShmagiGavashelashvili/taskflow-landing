import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApi, setupTestContainer, type TestApi } from "@/tests/api";
import { POST as forgotPassword } from "../forgot-password/route";
import { POST as login } from "../login/route";
import { POST } from "./route";

setupTestContainer();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  // Demo mode returns the reset link, which these tests follow. The generic response is tested below.
  vi.stubEnv("DEMO_MODE", "true");
});
afterEach(() => vi.useRealTimers());

async function requestReset(api: TestApi, email = "demo@taskflow.app") {
  const res = await api.request<{ resetUrl: string | null }>(forgotPassword, "/api/auth/forgot-password", {
    body: { email },
  });
  return res;
}

function tokenOf(resetUrl: string | null) {
  return new URL(resetUrl!, "http://localhost").searchParams.get("token")!;
}

describe("POST /api/auth/forgot-password", () => {
  it("in demo mode, returns a reset page link to show on screen", async () => {
    const res = await requestReset(createTestApi(), "DEMO@taskflow.app");

    expect(res.status).toBe(200);
    expect(res.body.resetUrl).toMatch(/^\/reset-password\?token=[\w-]{20,}$/);
  });

  it("in demo mode, returns no link for an unknown email", async () => {
    const res = await requestReset(createTestApi(), "nobody@taskflow.app");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ resetUrl: null });
  });

  it("returns the same generic response for known and unknown emails outside demo mode", async () => {
    vi.stubEnv("DEMO_MODE", "false");

    const known = await requestReset(createTestApi(), "demo@taskflow.app");
    const unknown = await requestReset(createTestApi(), "nobody@taskflow.app");

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body).toEqual({ resetUrl: null });
    expect(unknown.body).toEqual(known.body);
  });

  it("validates the email", async () => {
    const res = await createTestApi().request(forgotPassword, "/api/auth/forgot-password", { body: { email: "nope" } });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { email: [expect.any(String)] } } });
  });
});

describe("POST /api/auth/reset-password", () => {
  it("sets a new password: the new one logs in and the old one doesn't", async () => {
    const api = createTestApi();
    const token = tokenOf((await requestReset(api)).body.resetUrl);

    const res = await api.request(POST, "/api/auth/reset-password", { body: { token, password: "brand new pass" } });
    expect(res.status).toBe(204);

    const oldLogin = await api.request(login, "/api/auth/login", { body: { email: "demo@taskflow.app", password: "demo1234" } });
    expect(oldLogin.status).toBe(401);
    const newLogin = await api.request(login, "/api/auth/login", {
      body: { email: "demo@taskflow.app", password: "brand new pass" },
    });
    expect(newLogin.status).toBe(200);
  });

  it("works only once", async () => {
    const api = createTestApi();
    const token = tokenOf((await requestReset(api)).body.resetUrl);
    await api.request(POST, "/api/auth/reset-password", { body: { token, password: "brand new pass" } });

    const again = await api.request(POST, "/api/auth/reset-password", { body: { token, password: "another pass" } });

    expect(again.status).toBe(400);
    expect(again.body).toMatchObject({ error: { code: "INVALID_TOKEN" } });
  });

  it("expires after an hour", async () => {
    const api = createTestApi();
    const token = tokenOf((await requestReset(api)).body.resetUrl);

    vi.setSystemTime(new Date("2026-10-16T13:00:00.000Z"));
    const res = await api.request(POST, "/api/auth/reset-password", { body: { token, password: "brand new pass" } });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "INVALID_TOKEN" } });
  });

  it("accepts a link just before it expires", async () => {
    const api = createTestApi();
    const token = tokenOf((await requestReset(api)).body.resetUrl);

    vi.setSystemTime(new Date("2026-10-16T12:59:59.000Z"));
    const res = await api.request(POST, "/api/auth/reset-password", { body: { token, password: "brand new pass" } });

    expect(res.status).toBe(204);
  });

  it("rejects an unknown token", async () => {
    const res = await createTestApi().request(POST, "/api/auth/reset-password", {
      body: { token: "made-up", password: "brand new pass" },
    });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "INVALID_TOKEN" } });
  });

  it("enforces the password rules", async () => {
    const api = createTestApi();
    const token = tokenOf((await requestReset(api)).body.resetUrl);

    const res = await api.request(POST, "/api/auth/reset-password", { body: { token, password: "short" } });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { password: [expect.any(String)] } } });
  });
});
