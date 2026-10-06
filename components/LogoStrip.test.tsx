import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { companies } from "@/data";
import LogoStrip from "./LogoStrip";

describe("LogoStrip", () => {
  it("renders the trust heading", () => {
    render(<LogoStrip />);
    expect(screen.getByRole("heading", { name: "Trusted by 2,000+ teams" })).toBeInTheDocument();
  });

  it("lists every company as a wordmark", () => {
    render(<LogoStrip />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual(companies.map((c) => c.name));
  });

  it("renders the logos in grayscale with decorative marks", () => {
    const { container } = render(<LogoStrip />);
    for (const item of screen.getAllByRole("listitem")) expect(item).toHaveClass("grayscale");
    for (const svg of container.querySelectorAll("svg")) expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
