import { describe, expect, it } from "vitest";
import { effectivePlan, isTrialExpired, planLimits } from "./plans";

const now = new Date("2026-10-16T12:00:00.000Z");

describe("effectivePlan", () => {
  it("keeps a paid plan", () => {
    expect(effectivePlan({ plan: "pro", trialEndsAt: null }, now)).toBe("pro");
  });

  it("keeps the trial plan while the trial runs", () => {
    expect(effectivePlan({ plan: "business", trialEndsAt: "2026-10-20T00:00:00.000Z" }, now)).toBe("business");
  });

  it("falls back to Free once the trial ends", () => {
    const workspace = { plan: "pro" as const, trialEndsAt: "2026-10-16T12:00:00.000Z" };
    expect(isTrialExpired(workspace, now)).toBe(true);
    expect(effectivePlan(workspace, now)).toBe("free");
  });
});

describe("planLimits", () => {
  it("caps Free at 5 members and 3 active projects without paid features", () => {
    const limits = planLimits({ plan: "free", trialEndsAt: null }, now);
    expect(limits.maxMembers).toBe(5);
    expect(limits.maxActiveProjects).toBe(3);
    expect(Object.values(limits.features).every((on) => !on)).toBe(true);
  });

  it("unlocks everything on Pro", () => {
    const limits = planLimits({ plan: "pro", trialEndsAt: null }, now);
    expect(limits.maxActiveProjects).toBeNull();
    expect(limits.features.timeline).toBe(true);
  });
});
