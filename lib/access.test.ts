import { describe, expect, it } from "vitest";
import { BILLING_PATH, MEMBERS_PATH } from "./app-paths";
import { canOpen, isOwner } from "./access";

describe("canOpen", () => {
  it("keeps billing to owners", () => {
    expect(canOpen("owner", BILLING_PATH)).toBe(true);
    expect(canOpen("member", BILLING_PATH)).toBe(false);
  });

  it("lets everyone open other pages", () => {
    expect(canOpen("member", MEMBERS_PATH)).toBe(true);
    expect(isOwner("member")).toBe(false);
  });
});
