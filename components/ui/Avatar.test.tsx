import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Avatar from "./Avatar";

const GRADIENTS = [
  "from-blue-500 to-cyan-400",
  "from-teal-500 to-emerald-400",
  "from-amber-400 to-orange-500",
  "from-violet-500 to-fuchsia-400",
  "from-rose-500 to-pink-400",
];
const SIZES = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-8 w-8", xl: "h-12 w-12" };

describe("Avatar", () => {
  it("shows the initials and is hidden from assistive tech", () => {
    const { container } = render(<Avatar initials="MA" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveTextContent("MA");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("defaults to the first gradient and medium size", () => {
    const { container } = render(<Avatar initials="MA" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain(GRADIENTS[0]);
    expect(el.className).toContain(SIZES.md);
  });

  it.each([0, 1, 2, 3, 4] as const)("uses gradient %i for tone %i", (tone) => {
    const { container } = render(<Avatar initials="X" tone={tone} />);
    expect((container.firstElementChild as HTMLElement).className).toContain(GRADIENTS[tone]);
  });

  it.each(["sm", "md", "lg", "xl"] as const)("applies the %s size", (size) => {
    const { container } = render(<Avatar initials="X" size={size} />);
    expect((container.firstElementChild as HTMLElement).className).toContain(SIZES[size]);
  });

  it("merges a custom className", () => {
    const { container } = render(<Avatar initials="X" className="custom" />);
    expect(container.firstElementChild).toHaveClass("custom");
  });
});
