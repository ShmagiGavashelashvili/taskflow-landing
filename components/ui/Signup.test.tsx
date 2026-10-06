import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignupField, SignupLink } from "./Signup";

describe("SignupField", () => {
  it("renders the labelled email form under the signup anchor", () => {
    const { container } = render(<SignupField className="wide" />);
    expect(container.firstElementChild).toHaveAttribute("id", "get-started");
    expect(container.firstElementChild).toHaveClass("wide");
    expect(screen.getByLabelText("Work email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Get Started Free/ })).toBeInTheDocument();
  });

  it("renders its children under the form", () => {
    render(<SignupField>No credit card required</SignupField>);
    expect(screen.getByText("No credit card required")).toBeInTheDocument();
  });
});

describe("SignupLink", () => {
  it("renders a link to the signup anchor", () => {
    render(<SignupLink className="btn">Start Free Trial</SignupLink>);
    const link = screen.getByRole("link", { name: "Start Free Trial" });
    expect(link).toHaveAttribute("href", "#get-started");
    expect(link).toHaveClass("btn");
  });

  it("points at the anchor the field renders", () => {
    const { container } = render(
      <>
        <SignupLink>Go</SignupLink>
        <SignupField />
      </>,
    );
    const href = screen.getByRole("link", { name: "Go" }).getAttribute("href") as string;
    expect(container.querySelector(href)).toBeInTheDocument();
  });

  it("scrolls to and focuses the email field instead of jumping", () => {
    render(
      <>
        <SignupField />
        <SignupLink>Go</SignupLink>
      </>,
    );
    const input = screen.getByLabelText("Work email");
    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "Go" }));
    expect(notPrevented).toBe(false);
    expect(input.scrollIntoView).toHaveBeenCalledWith({ block: "center" });
    expect(input).toHaveFocus();
  });

  it("falls back to the plain anchor when the field is missing", () => {
    render(<SignupLink>Go</SignupLink>);
    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "Go" }));
    expect(notPrevented).toBe(true);
  });

  it("calls onNavigate in both cases", () => {
    const onNavigate = vi.fn();
    const { unmount } = render(<SignupLink onNavigate={onNavigate}>Go</SignupLink>);
    fireEvent.click(screen.getByRole("link", { name: "Go" }));
    unmount();
    render(
      <>
        <SignupField />
        <SignupLink onNavigate={onNavigate}>Go</SignupLink>
      </>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Go" }));
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });
});
