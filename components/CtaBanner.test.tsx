import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CtaBanner from "./CtaBanner";

describe("CtaBanner", () => {
  it("renders the headline and supporting copy", () => {
    render(<CtaBanner />);
    expect(screen.getByRole("heading", { level: 2, name: "Ready to get your team in flow?" })).toBeInTheDocument();
    expect(screen.getByText(/Join 2,000\+ teams/)).toBeInTheDocument();
  });

  it("has a Start Free Trial link to registration", () => {
    render(<CtaBanner />);
    expect(screen.getByRole("link", { name: "Start Free Trial" })).toHaveAttribute("href", "/register");
  });

  it("is a labelled region", () => {
    render(<CtaBanner />);
    expect(screen.getByRole("region", { name: "Ready to get your team in flow?" })).toBeInTheDocument();
  });
});
