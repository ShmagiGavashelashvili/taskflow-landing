import { describe, expect, it } from "vitest";
import { buttonClass } from "./ui";

describe("buttonClass", () => {
  it("defaults to the primary medium button", () => {
    const classes = buttonClass();
    expect(classes).toContain("inline-flex");
    expect(classes).toContain("bg-brand");
    expect(classes).toContain("h-11");
  });

  it.each([
    ["primary", "bg-brand"],
    ["secondary", "border-line"],
    ["light", "text-brand-strong"],
  ] as const)("includes the %s variant classes", (variant, expected) => {
    expect(buttonClass(variant)).toContain(expected);
  });

  it.each([
    ["md", "h-11"],
    ["lg", "h-12"],
  ] as const)("includes the %s size classes", (size, expected) => {
    expect(buttonClass("primary", size)).toContain(expected);
  });

  it("appends extra classes and trims when there are none", () => {
    expect(buttonClass("primary", "md", "w-full")).toMatch(/ w-full$/);
    expect(buttonClass("primary", "md")).not.toMatch(/\s$/);
  });
});
