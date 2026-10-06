import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { stats, testimonials } from "@/data";
import Testimonials from "./Testimonials";

describe("Testimonials", () => {
  it("renders the heading", () => {
    render(<Testimonials />);
    expect(screen.getByRole("heading", { level: 2, name: "Teams that switched don't look back" })).toBeInTheDocument();
  });

  it("renders each testimonial with quote, name, role and company", () => {
    render(<Testimonials />);
    const figures = screen.getAllByRole("figure");
    expect(figures).toHaveLength(3);
    testimonials.forEach((t, i) => {
      expect(within(figures[i]).getByText(`“${t.quote}”`)).toBeInTheDocument();
      expect(within(figures[i]).getByText(t.name)).toBeInTheDocument();
      expect(within(figures[i]).getByText(`${t.role}, ${t.company}`)).toBeInTheDocument();
    });
  });

  it("shows avatar initials that are hidden from assistive tech", () => {
    render(<Testimonials />);
    const figures = screen.getAllByRole("figure");
    testimonials.forEach((t, i) => {
      const avatar = within(figures[i]).getByText(t.initials);
      expect(avatar).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("shows headline stats with their labels and screen-reader values", () => {
    const { container } = render(<Testimonials />);
    for (const stat of stats) {
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    }
    const srValues = [...container.querySelectorAll("dd .sr-only")].map((el) => el.textContent);
    expect(srValues).toEqual(["40%", "10k+", "4.9/5"]);
  });

  it("pairs each stat value (dd) with its label (dt)", () => {
    const { container } = render(<Testimonials />);
    expect(container.querySelectorAll("dl > div")).toHaveLength(stats.length);
    for (const group of container.querySelectorAll("dl > div")) {
      expect(group.querySelector("dt")).toBeInTheDocument();
      expect(group.querySelector("dd")).toBeInTheDocument();
    }
  });
});
