import { describe, expect, it } from "vitest";
import { trialDaysLeft } from "./trial";

const now = new Date("2026-10-16T12:00:00.000Z");

describe("trialDaysLeft", () => {
  it("is null when there's no trial", () => {
    expect(trialDaysLeft(null, now)).toBeNull();
  });

  it("counts a fresh 14-day trial as 14 days", () => {
    expect(trialDaysLeft("2026-10-30T12:00:00.000Z", now)).toBe(14);
  });

  it("rounds a partial day up, so the last day reads as 1", () => {
    expect(trialDaysLeft("2026-10-16T13:00:00.000Z", now)).toBe(1);
  });

  it("is 0 once the trial has ended", () => {
    expect(trialDaysLeft("2026-10-16T12:00:00.000Z", now)).toBe(0);
    expect(trialDaysLeft("2026-10-01T00:00:00.000Z", now)).toBe(0);
  });
});
