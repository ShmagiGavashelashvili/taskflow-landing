import { afterEach, describe, expect, it, vi } from "vitest";

async function loadSiteUrl() {
  vi.resetModules();
  return (await import("./site")).SITE_URL;
}

describe("SITE_URL", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("prefers NEXT_PUBLIC_SITE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://taskflow.example");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "ignored.vercel.app");
    expect(await loadSiteUrl()).toBe("https://taskflow.example");
  });

  it("falls back to the Vercel production URL over https", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined as unknown as string);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "taskflow.vercel.app");
    expect(await loadSiteUrl()).toBe("https://taskflow.vercel.app");
  });

  it("falls back to localhost when nothing is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined as unknown as string);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", undefined as unknown as string);
    expect(await loadSiteUrl()).toBe("http://localhost:3000");
  });
});
