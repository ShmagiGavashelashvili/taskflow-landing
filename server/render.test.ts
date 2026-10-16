import { notFound, redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { DomainError } from "@/server/domain/errors";
import { withFallback } from "./render";

describe("withFallback", () => {
  it("returns what the render produced", async () => {
    await expect(withFallback(async () => "links", "fallback")).resolves.toBe("links");
  });

  it("returns the fallback, and logs, when the render fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await withFallback(async () => {
      throw new DomainError("UNAVAILABLE", "The service is temporarily unavailable.");
    }, "fallback");

    expect(result).toBe("fallback");
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("lets redirects and not-found through", async () => {
    await expect(withFallback(async () => redirect("/api/auth/logout"), "fallback")).rejects.toThrow("NEXT_REDIRECT");
    await expect(withFallback(async () => notFound(), "fallback")).rejects.toThrow();
  });
});
