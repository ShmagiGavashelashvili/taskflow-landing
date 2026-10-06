import { describe, expect, it } from "vitest";
import { BAR_TONE_CLASSES } from "./tones";

describe("BAR_TONE_CLASSES", () => {
  it("has a fill class for every tone", () => {
    expect(Object.keys(BAR_TONE_CLASSES).sort()).toEqual(["amber", "blue", "rose", "slate", "teal", "violet"]);
  });
});
