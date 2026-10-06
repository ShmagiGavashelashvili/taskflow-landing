import { describe, expect, it } from "vitest";
import { BUTTON_BASE_CLASS, BUTTON_SIZE_CLASSES, BUTTON_VARIANT_CLASSES } from "@/constants/ui";
import { buttonClass } from "./ui";

describe("buttonClass", () => {
  it("defaults to the primary medium button", () => {
    expect(buttonClass()).toBe(
      `${BUTTON_BASE_CLASS} ${BUTTON_VARIANT_CLASSES.primary} ${BUTTON_SIZE_CLASSES.md}`,
    );
  });

  it.each(["primary", "secondary", "light"] as const)("includes the %s variant classes", (variant) => {
    expect(buttonClass(variant)).toContain(BUTTON_VARIANT_CLASSES[variant]);
  });

  it.each(["md", "lg"] as const)("includes the %s size classes", (size) => {
    expect(buttonClass("primary", size)).toContain(BUTTON_SIZE_CLASSES[size]);
  });

  it("appends extra classes and trims when there are none", () => {
    expect(buttonClass("primary", "md", "w-full")).toMatch(/ w-full$/);
    expect(buttonClass("primary", "md")).not.toMatch(/\s$/);
  });
});
