import { describe, expect, it } from "vitest";
import { BOARD_COLUMNS } from "./board.data";
import { VELOCITY } from "./reports.data";
import { TIMELINE_DAYS, TIMELINE_ROWS } from "./timeline.data";

describe("mockup data", () => {
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
