import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { faqs } from "@/data";
import FAQ from "./FAQ";

describe("FAQ", () => {
  it("renders the section under the faq anchor with a heading", () => {
    const { container } = render(<FAQ />);
    expect(container.querySelector("section")).toHaveAttribute("id", "faq");
    expect(screen.getByRole("heading", { level: 2, name: "Questions, answered" })).toBeInTheDocument();
  });

  it("covers trial, cancellation, security, integrations and team size", () => {
    render(<FAQ />);
    for (const topic of [/free trial/i, /cancel/i, /secure/i, /integrate/i, /team size/i]) {
      expect(screen.getByRole("button", { name: topic })).toBeInTheDocument();
    }
  });

  it("renders every question from the data", () => {
    render(<FAQ />);
    for (const faq of faqs) expect(screen.getByRole("button", { name: faq.question })).toBeInTheDocument();
  });
});
