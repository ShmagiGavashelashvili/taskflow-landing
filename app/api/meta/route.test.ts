import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestApi, setupTestContainer } from "@/tests/api";
import { GET } from "./route";

const container = setupTestContainer();

describe("GET /api/meta", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reports demo mode with the seeded demo account by default", async () => {
    const res = await createTestApi().request(GET, "/api/meta");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      demoMode: true,
      dataSource: "memory",
      demoAccount: { email: "demo@taskflow.app", password: "demo1234" },
    });
  });

  it("hides the demo account when demo mode is turned off", async () => {
    vi.stubEnv("DEMO_MODE", "false");

    const res = await createTestApi().request(GET, "/api/meta");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ demoMode: false, demoAccount: null });
  });

  it("returns the error shape with 503 when the store fails", async () => {
    container.reset({ failureRate: 1 });

    const res = await createTestApi().request(GET, "/api/meta");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: { code: "UNAVAILABLE", message: expect.any(String) },
    });
  });
});
