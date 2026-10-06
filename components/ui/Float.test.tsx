import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { media } from "../../tests/setup";
import Float from "./Float";

describe("Float", () => {
  it("renders its children and className", () => {
    render(
      <Float className="floaty">
        <p>mockup</p>
      </Float>,
    );
    expect(screen.getByText("mockup")).toBeInTheDocument();
    expect(screen.getByText("mockup").parentElement).toHaveClass("floaty");
  });

  it("applies a scroll-linked transform by default", () => {
    render(
      <Float>
        <p>mockup</p>
      </Float>,
    );
    expect((screen.getByText("mockup").parentElement as HTMLElement).style.transform).not.toBe("");
  });

  it("does not move under reduced motion", () => {
    media.reduceMotion = true;
    render(
      <Float>
        <p>mockup</p>
      </Float>,
    );
    expect((screen.getByText("mockup").parentElement as HTMLElement).style.transform).toBe("");
  });
});
