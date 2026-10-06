import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BRAND_ICONS, GithubIcon, LinkedinIcon, XIcon } from "./BrandIcons";

describe("BrandIcons", () => {
  it.each([
    ["GithubIcon", GithubIcon],
    ["XIcon", XIcon],
    ["LinkedinIcon", LinkedinIcon],
  ])("%s renders a decorative filled svg path", (_name, Icon) => {
    const { container } = render(<Icon className="h-4 w-4" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("fill", "currentColor");
    expect(svg).toHaveClass("h-4");
    expect(container.querySelector("path")?.getAttribute("d")).toBeTruthy();
  });

  it("maps every brand name to its icon", () => {
    expect(BRAND_ICONS).toEqual({ x: XIcon, github: GithubIcon, linkedin: LinkedinIcon });
  });
});
