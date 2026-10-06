import { describe, expect, it } from "vitest";
import { EMAIL_PATTERN, SIMULATED_LATENCY_MS } from "./forms";
import { BOARD_COLUMNS, TIMELINE_DAYS, TIMELINE_ROWS, VELOCITY } from "./mockups";
import { BILLING_OPTIONS } from "./pricing";
import { NEWSLETTER_INPUT_ID, SIGNUP_INPUT_ID } from "./site";
import { AVATAR_GRADIENTS, AVATAR_SIZE_CLASSES, BADGE_TONE_CLASSES, BAR_TONE_CLASSES } from "./ui";

describe("constants", () => {
  it("uses distinct input ids for the two forms", () => {
    expect(SIGNUP_INPUT_ID).not.toBe(NEWSLETTER_INPUT_ID);
  });

  it("offers monthly then yearly billing", () => {
    expect(BILLING_OPTIONS.map((o) => o.value)).toEqual(["monthly", "yearly"]);
  });

  it("has a positive simulated latency and a usable email pattern", () => {
    expect(SIMULATED_LATENCY_MS).toBeGreaterThan(0);
    expect(EMAIL_PATTERN.test("a@b.co")).toBe(true);
    expect(EMAIL_PATTERN.test("nope")).toBe(false);
  });

  it("has a class for every avatar gradient slot, size and tone", () => {
    expect(AVATAR_GRADIENTS).toHaveLength(5);
    expect(Object.keys(AVATAR_SIZE_CLASSES).sort()).toEqual(["lg", "md", "sm", "xl"]);
    expect(Object.keys(BADGE_TONE_CLASSES).sort()).toEqual(Object.keys(BAR_TONE_CLASSES).sort());
  });

  it("keeps timeline rows inside the day grid", () => {
    for (const row of TIMELINE_ROWS) {
      expect(row.start).toBeGreaterThanOrEqual(1);
      expect(row.end).toBeGreaterThan(row.start);
      expect(row.end).toBeLessThanOrEqual(TIMELINE_DAYS + 1);
      expect(row.progress).toBeGreaterThanOrEqual(0);
      expect(row.progress).toBeLessThanOrEqual(100);
    }
  });

  it("has board cards with valid progress and velocity data", () => {
    for (const card of BOARD_COLUMNS.flatMap((c) => c.cards)) {
      if (card.progress !== undefined) expect(card.progress).toBeLessThanOrEqual(100);
      expect(card.people.length).toBeGreaterThan(0);
    }
    expect(VELOCITY.every((v) => v.value > 0)).toBe(true);
  });
});
