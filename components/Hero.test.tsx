import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Hero from "./Hero";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("Hero", () => {
  beforeEach(() => router.push.mockReset());

  it("renders the headline, subheadline and the free-trial note", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Your Team.s Work,\s*Finally in One Place/,
    );
    expect(screen.getByText(/brings tasks, timelines and team chat together/)).toBeInTheDocument();
    expect(screen.getByText("No credit card required · 14-day free trial")).toBeInTheDocument();
  });

  it("is labelled by its headline and anchors the signup target", () => {
    const { container } = render(<Hero />);
    expect(screen.getByRole("region", { name: /Your Team.s Work/ })).toHaveAttribute("id", "top");
    expect(container.querySelector("#get-started")).toBeInTheDocument();
  });

  it("has the focusable email field used by every 'Start Free Trial' link", () => {
    render(<Hero />);
    const input = screen.getByLabelText("Work email");
    expect(input).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Get Started Free/ })).toBeInTheDocument();
  });

  it("includes the decorative dashboard mockup, hidden from assistive tech", () => {
    const { container } = render(<Hero />);
    const mockup = container.querySelector('[aria-hidden="true"].shadow-float');
    expect(mockup).toBeInTheDocument();
    expect(mockup).toHaveTextContent("Website Relaunch");
  });

  it("validates the email and then goes to registration with it", async () => {
    const user = userEvent.setup();
    render(<Hero />);
    await user.click(screen.getByRole("button", { name: /Get Started Free/ }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Work email"), "jane@example.com");
    await user.click(screen.getByRole("button", { name: /Get Started Free/ }));
    expect(router.push).toHaveBeenCalledExactlyOnceWith("/register?email=jane%40example.com");
  });
});
