import { describe, expect, it } from "vitest";
import { validateEmail } from "./validateEmail";

describe("validateEmail", () => {
  it.each(["jane@example.com", "a.b+tag@sub.domain.io", "x@y.co"])("accepts %s", (email) => {
    expect(validateEmail(email)).toBeNull();
  });

  it("trims surrounding whitespace before validating", () => {
    expect(validateEmail("  jane@example.com  ")).toBeNull();
  });

  it.each(["", "   "])("asks for an address when the value is empty (%j)", (value) => {
    expect(validateEmail(value)).toBe("Please enter your email address.");
  });

  it.each(["plain", "no-at.example.com", "@example.com", "jane@", "jane@example", "jane@example.c", "ja ne@example.com", "a@b@c.com"])(
    "rejects %s as invalid",
    (value) => {
      expect(validateEmail(value)).toBe("That doesn't look like a valid email address.");
    },
  );
});
