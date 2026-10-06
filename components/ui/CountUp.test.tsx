import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { media } from "../../tests/setup";
import { control, triggerAll } from "../../tests/intersection";
import CountUp from "./CountUp";

const visibleText = (container: HTMLElement) =>
  container.querySelector('[aria-hidden="true"]')?.textContent;

describe("CountUp", () => {
  it("exposes the final value to screen readers immediately", () => {
    control.auto = false;
    render(<CountUp value={4.9} decimals={1} suffix="/5" />);
    expect(screen.getByText("4.9/5", { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("shows 0 until it scrolls into view", () => {
    control.auto = false;
    const { container } = render(<CountUp value={40} suffix="%" />);
    expect(visibleText(container)).toBe("0%");
  });

  it("counts up to the final value once in view", async () => {
    const { container } = render(<CountUp value={40} suffix="%" />);
    await waitFor(() => expect(visibleText(container)).toBe("40%"), { timeout: 4000 });
  });

  it("formats decimals and the suffix", async () => {
    const { container } = render(<CountUp value={4.9} decimals={1} suffix="/5" />);
    await waitFor(() => expect(visibleText(container)).toBe("4.9/5"), { timeout: 4000 });
  });

  it("jumps straight to the final value under reduced motion, with no animation", () => {
    media.reduceMotion = true;
    control.auto = false;
    const { container } = render(<CountUp value={10} suffix="k+" />);
    expect(visibleText(container)).toBe("0k+");
    act(() => triggerAll(true));
    expect(visibleText(container)).toBe("10k+");
  });

  it("still animates (does not jump) when motion is allowed", () => {
    control.auto = false;
    const { container } = render(<CountUp value={10} suffix="k+" />);
    act(() => triggerAll(true));
    expect(visibleText(container)).toBe("0k+");
  });

  it("applies a className", () => {
    control.auto = false;
    const { container } = render(<CountUp value={1} className="big" />);
    expect(container.firstElementChild).toHaveClass("big");
  });
});
