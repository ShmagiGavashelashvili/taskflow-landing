import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { control, triggerAll } from "../../tests/intersection";
import Reveal from "./Reveal";

describe("Reveal", () => {
  it("renders its children and className", () => {
    render(
      <Reveal className="wrapper">
        <p>hello</p>
      </Reveal>,
    );
    expect(screen.getByText("hello").parentElement).toHaveClass("wrapper");
  });

  it("starts hidden and slid down until scrolled into view", () => {
    control.auto = false;
    render(
      <Reveal>
        <p>hello</p>
      </Reveal>,
    );
    const wrapper = screen.getByText("hello").parentElement as HTMLElement;
    expect(wrapper.style.opacity).toBe("0");
    expect(wrapper.style.transform).toContain("translateY(24px)");
  });

  it("becomes visible once it enters the viewport", async () => {
    control.auto = false;
    render(
      <Reveal>
        <p>hello</p>
      </Reveal>,
    );
    const wrapper = screen.getByText("hello").parentElement as HTMLElement;
    triggerAll(true);
    await waitFor(() => expect(wrapper.style.opacity).toBe("1"), { timeout: 3000 });
  });
});
