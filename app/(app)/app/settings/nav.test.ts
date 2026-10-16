import { describe, expect, it } from "vitest";
import { settingsNavFor } from "./nav";

describe("settingsNavFor", () => {
  it("shows Billing to owners", () => {
    expect(settingsNavFor("owner").map((item) => item.label)).toEqual([
      "Profile",
      "Workspace",
      "Members",
      "Billing",
      "Integrations",
      "Automations",
    ]);
  });

  it("hides Billing from members", () => {
    expect(settingsNavFor("member").map((item) => item.label)).toEqual([
      "Profile",
      "Workspace",
      "Members",
      "Integrations",
      "Automations",
    ]);
  });
});
