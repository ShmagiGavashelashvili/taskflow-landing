import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MotionProvider from "./MotionProvider";

describe("MotionProvider", () => {
  it("renders its children", () => {
    render(
      <MotionProvider>
        <p>inside</p>
      </MotionProvider>,
    );
    expect(screen.getByText("inside")).toBeInTheDocument();
  });
});
