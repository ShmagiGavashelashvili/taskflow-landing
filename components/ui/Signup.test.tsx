import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignupField } from "./Signup";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => router.push.mockReset());

describe("SignupField", () => {
  it("renders the labelled email form under the signup anchor", () => {
    const { container } = render(<SignupField className="wide" />);
    expect(container.firstElementChild).toHaveAttribute("id", "get-started");
    expect(container.firstElementChild).toHaveClass("wide");
    expect(screen.getByLabelText("Work email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Get Started Free/ })).toBeInTheDocument();
  });

  it("goes to registration with the typed email pre-filled", async () => {
    const user = userEvent.setup();
    render(<SignupField />);
    await user.type(screen.getByLabelText("Work email"), "  jane+trial@example.com {Enter}");
    expect(router.push).toHaveBeenCalledExactlyOnceWith("/register?email=jane%2Btrial%40example.com");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("stays on the page with an error for an invalid email", async () => {
    const user = userEvent.setup();
    render(<SignupField />);
    await user.type(screen.getByLabelText("Work email"), "jane@{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("That doesn't look like a valid email address.");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("renders its children under the form", () => {
    render(<SignupField>No credit card required</SignupField>);
    expect(screen.getByText("No credit card required")).toBeInTheDocument();
  });
});
