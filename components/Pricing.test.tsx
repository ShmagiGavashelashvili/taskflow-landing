import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Pricing from "./Pricing";

describe("Pricing", () => {
  it("renders the labelled section under the pricing anchor", () => {
    const { container } = render(<Pricing />);
    expect(container.querySelector("section")).toHaveAttribute("id", "pricing");
    expect(screen.getByRole("heading", { level: 2, name: /Simple pricing/ })).toBeInTheDocument();
  });

  it("shows the yearly savings next to the toggle", () => {
    render(<Pricing />);
    expect(screen.getByText("Save 20%")).toBeInTheDocument();
  });

  it("renders all three plans", () => {
    render(<Pricing />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Free",
      "Pro",
      "Business",
    ]);
  });
});
