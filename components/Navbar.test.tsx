import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SIGNUP_INPUT_ID } from "@/constants/site";
import { navLinks } from "@/data";
import Navbar from "./Navbar";

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("Navbar", () => {
  it("renders the logo link, nav links, log in and the trial CTA", () => {
    render(<Navbar />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "TaskFlow home" })).toHaveAttribute("href", "#top");
    for (const link of navLinks) {
      expect(within(nav).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
    expect(within(nav).getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Start Free Trial" })).toHaveAttribute("href", "#get-started");
  });

  it("is transparent at the top and blurred once scrolled", () => {
    render(<Navbar />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("bg-transparent");
    scrollTo(100);
    expect(header).toHaveClass("backdrop-blur-xl");
    scrollTo(0);
    expect(header).toHaveClass("bg-transparent");
  });

  describe("mobile menu", () => {
    it("is closed by default with an accessible toggle", () => {
      render(<Navbar />);
      const toggle = screen.getByRole("button", { name: "Open menu" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle).toHaveAttribute("aria-controls", "mobile-menu");
      expect(document.getElementById("mobile-menu")).toBeNull();
    });

    it("opens and closes with the toggle, and blurs the header while open", async () => {
      const user = userEvent.setup();
      render(<Navbar />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const menu = document.getElementById("mobile-menu") as HTMLElement;
      expect(menu).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("banner")).toHaveClass("backdrop-blur-xl");
      for (const link of navLinks) expect(within(menu).getByRole("link", { name: link.label })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close menu" }));
      expect(document.getElementById("mobile-menu")).toBeNull();
    });

    it("closes when a menu link is chosen", async () => {
      const user = userEvent.setup();
      render(<Navbar />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const menu = document.getElementById("mobile-menu") as HTMLElement;
      await user.click(within(menu).getByRole("link", { name: "Pricing" }));
      expect(document.getElementById("mobile-menu")).toBeNull();
    });

    it("closes on Escape", async () => {
      const user = userEvent.setup();
      render(<Navbar />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      await user.keyboard("{Escape}");
      expect(document.getElementById("mobile-menu")).toBeNull();
    });

    it("closes and focuses the signup field from the mobile trial button", async () => {
      const user = userEvent.setup();
      render(
        <>
          <input id={SIGNUP_INPUT_ID} aria-label="email" />
          <Navbar />
        </>,
      );
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const menu = document.getElementById("mobile-menu") as HTMLElement;
      fireEvent.click(within(menu).getByRole("link", { name: "Start Free Trial" }));
      expect(document.getElementById("mobile-menu")).toBeNull();
      expect(screen.getByLabelText("email")).toHaveFocus();
    });
  });
});
