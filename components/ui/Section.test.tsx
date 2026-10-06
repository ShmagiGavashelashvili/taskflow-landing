import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Section, { SectionHeading } from "./Section";

describe("Section", () => {
  it("renders children inside a labelled section with an id", () => {
    render(
      <Section id="features" labelledBy="features-title">
        <h2 id="features-title">Features</h2>
      </Section>,
    );
    const section = screen.getByRole("region", { name: "Features" });
    expect(section).toHaveAttribute("id", "features");
  });

  it("is not a landmark without a label", () => {
    render(
      <Section>
        <p>content</p>
      </Section>,
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("adds extra classes", () => {
    const { container } = render(<Section className="bg-white/60">x</Section>);
    expect(container.querySelector("section")).toHaveClass("bg-white/60");
  });
});

describe("SectionHeading", () => {
  it("renders the eyebrow, title and description", () => {
    render(<SectionHeading id="t" eyebrow="Pricing" title="Simple pricing" description="Start free." />);
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Simple pricing" })).toHaveAttribute("id", "t");
    expect(screen.getByText("Start free.")).toBeInTheDocument();
  });

  it("omits the description when not given", () => {
    const { container } = render(<SectionHeading id="t" eyebrow="E" title="T" />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });
});
