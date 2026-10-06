import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SIGNUP_INPUT_ID } from "@/constants/site";
import CtaBanner from "./CtaBanner";

describe("CtaBanner", () => {
  it("renders the headline and supporting copy", () => {
    render(<CtaBanner />);
    expect(screen.getByRole("heading", { level: 2, name: "Ready to get your team in flow?" })).toBeInTheDocument();
    expect(screen.getByText(/Join 2,000\+ teams/)).toBeInTheDocument();
  });

  it("has a Start Free Trial link that focuses the signup field", () => {
    render(
      <>
        <input id={SIGNUP_INPUT_ID} aria-label="email" />
        <CtaBanner />
      </>,
    );
    const link = screen.getByRole("link", { name: "Start Free Trial" });
    expect(link).toHaveAttribute("href", "#get-started");
    fireEvent.click(link);
    expect(screen.getByLabelText("email")).toHaveFocus();
  });

  it("is a labelled region", () => {
    render(<CtaBanner />);
    expect(screen.getByRole("region", { name: "Ready to get your team in flow?" })).toBeInTheDocument();
  });
});
