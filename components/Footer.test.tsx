import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SIMULATED_LATENCY_MS } from "@/constants/forms";
import { COPYRIGHT_YEAR, NEWSLETTER_INPUT_ID } from "@/constants/site";
import { footerColumns, socialLinks } from "@/data";
import Footer from "./Footer";

describe("Footer", () => {
  afterEach(() => vi.useRealTimers());

  it("renders the four link columns with their links", () => {
    render(<Footer />);
    for (const column of footerColumns) {
      const nav = screen.getByRole("navigation", { name: column.title });
      for (const link of column.links) {
        expect(within(nav).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
      }
    }
  });

  it("renders labelled social links with icons", () => {
    render(<Footer />);
    for (const social of socialLinks) {
      const link = screen.getByRole("link", { name: social.label });
      expect(link.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("shows the copyright and the portfolio demo note", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(`© ${COPYRIGHT_YEAR} TaskFlow, Inc`))).toBeInTheDocument();
    expect(screen.getByText(/portfolio demo project/)).toBeInTheDocument();
  });

  it("has a newsletter form with validation", async () => {
    const user = userEvent.setup();
    render(<Footer />);
    const input = screen.getByLabelText("Email for the newsletter");
    expect(input).toHaveAttribute("id", NEWSLETTER_INPUT_ID);
    await user.click(screen.getByRole("button", { name: /Subscribe/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter your email address.");
  });

  it("shows the newsletter success state", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Footer />);
    await user.type(screen.getByLabelText("Email for the newsletter"), "jane@example.com");
    await user.click(screen.getByRole("button", { name: /Subscribe/ }));
    act(() => vi.advanceTimersByTime(SIMULATED_LATENCY_MS));
    expect(screen.getByRole("status")).toHaveTextContent("Thanks for subscribing!");
  });
});
