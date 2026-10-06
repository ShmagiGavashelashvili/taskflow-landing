import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { features } from "@/data";
import Features from "./Features";

describe("Features", () => {
  it("renders the section heading under the features anchor", () => {
    const { container } = render(<Features />);
    expect(container.querySelector("section")).toHaveAttribute("id", "features");
    expect(screen.getByRole("heading", { level: 2, name: /Everything your team needs/ })).toBeInTheDocument();
  });

  it("renders one card per feature with title and description", () => {
    render(<Features />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(6);
    features.forEach((feature, i) => {
      expect(within(items[i]).getByRole("heading", { level: 3, name: feature.title })).toBeInTheDocument();
      expect(within(items[i]).getByText(feature.description)).toBeInTheDocument();
    });
  });

  it("includes all six named features", () => {
    render(<Features />);
    for (const name of ["Task Boards", "Timeline View", "Team Chat", "Automations", "Reports", "Integrations"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  it("marks each icon as decorative", () => {
    const { container } = render(<Features />);
    const icons = container.querySelectorAll("li svg");
    expect(icons).toHaveLength(6);
    for (const icon of icons) expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
