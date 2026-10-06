import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import EmailCapture from "./EmailCapture";

const props = {
  inputId: "email-field",
  label: "Work email",
  buttonLabel: "Get Started Free",
  successTitle: "You're on the list!",
  successMessage: "Demo only.",
};

function setup(extra: Partial<React.ComponentProps<typeof EmailCapture>> = {}) {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<EmailCapture {...props} {...extra} />);
  return user;
}

describe("EmailCapture", () => {
  afterEach(() => vi.useRealTimers());

  it("renders a labelled email input and a submit button", () => {
    setup();
    const input = screen.getByLabelText("Work email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("id", "email-field");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(screen.getByRole("button", { name: /Get Started Free/ })).toBeEnabled();
  });

  it("shows no error before submitting", () => {
    setup();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Work email")).not.toHaveAttribute("aria-invalid");
  });

  it("shows an accessible error for an empty submit", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: /Get Started Free/ }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Please enter your email address.");
    const input = screen.getByLabelText("Work email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);
  });

  it("shows an error for an invalid email and submits with Enter", async () => {
    const user = setup();
    await user.type(screen.getByLabelText("Work email"), "not-an-email{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("That doesn't look like a valid email address.");
  });

  it("clears the error when the user edits the field", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: /Get Started Free/ }));
    await user.type(screen.getByLabelText("Work email"), "j");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables the button and shows progress while submitting, then success", async () => {
    const user = setup();
    await user.type(screen.getByLabelText("Work email"), "jane@example.com");
    await user.click(screen.getByRole("button", { name: /Get Started Free/ }));
    const sending = screen.getByRole("button", { name: /Sending/ });
    expect(sending).toBeDisabled();
    act(() => vi.advanceTimersByTime(800));
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("You're on the list!");
    expect(status).toHaveTextContent("Demo only.");
    expect(screen.queryByLabelText("Work email")).not.toBeInTheDocument();
  });

  it("returns to an empty form via 'Use a different email'", async () => {
    const user = setup();
    await user.type(screen.getByLabelText("Work email"), "jane@example.com");
    await user.click(screen.getByRole("button", { name: /Get Started Free/ }));
    act(() => vi.advanceTimersByTime(800));
    await user.click(screen.getByRole("button", { name: "Use a different email" }));
    expect(screen.getByLabelText("Work email")).toHaveValue("");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("supports the dark theme", async () => {
    const user = setup({ theme: "dark" });
    expect(screen.getByLabelText("Work email")).toHaveClass("text-white");
    await user.type(screen.getByLabelText("Work email"), "jane@example.com");
    await user.click(screen.getByRole("button", { name: /Get Started Free/ }));
    act(() => vi.advanceTimersByTime(800));
    expect(screen.getByRole("status")).toHaveClass("text-white");
  });
});
