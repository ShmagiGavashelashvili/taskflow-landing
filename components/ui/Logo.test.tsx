import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Logo from "./Logo";

describe("Logo", () => {
  it("renders the wordmark", () => {
    render(<Logo />);
    expect(screen.getByText("TaskFlow")).toBeInTheDocument();
  });

  it("uses dark text by default and white text on the light tone", () => {
    const { rerender } = render(<Logo />);
    expect(screen.getByText("TaskFlow")).toHaveClass("text-ink");
    rerender(<Logo tone="light" />);
    expect(screen.getByText("TaskFlow")).toHaveClass("text-white");
  });

  it("hides the decorative mark and namespaces its gradient id by tone", () => {
    const { container, rerender } = render(<Logo />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("linearGradient")).toHaveAttribute("id", "logo-dark");
    rerender(<Logo tone="light" />);
    expect(container.querySelector("linearGradient")).toHaveAttribute("id", "logo-light");
  });

  it("accepts a className", () => {
    const { container } = render(<Logo className="mine" />);
    expect(container.firstElementChild).toHaveClass("mine");
  });
});
