import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SIGNUP_INPUT_ID } from "@/constants/site";
import SignupLink from "./SignupLink";

describe("SignupLink", () => {
  it("renders a link to the signup anchor", () => {
    render(<SignupLink className="btn">Start Free Trial</SignupLink>);
    const link = screen.getByRole("link", { name: "Start Free Trial" });
    expect(link).toHaveAttribute("href", "#get-started");
    expect(link).toHaveClass("btn");
  });

  it("scrolls to and focuses the email field instead of jumping", () => {
    render(
      <>
        <input id={SIGNUP_INPUT_ID} aria-label="email" />
        <SignupLink>Go</SignupLink>
      </>,
    );
    const input = screen.getByLabelText("email");
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
        <input id={SIGNUP_INPUT_ID} aria-label="email" />
        <SignupLink onNavigate={onNavigate}>Go</SignupLink>
      </>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Go" }));
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });
});
