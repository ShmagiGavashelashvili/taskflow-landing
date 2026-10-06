import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AVATAR_GRADIENTS, AVATAR_SIZE_CLASSES } from "@/constants/ui";
import Avatar from "./Avatar";

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
    expect(el.className).toContain(AVATAR_GRADIENTS[0]);
    expect(el.className).toContain(AVATAR_SIZE_CLASSES.md);
  });

  it.each([0, 1, 2, 3, 4] as const)("uses gradient %i for tone %i", (tone) => {
    const { container } = render(<Avatar initials="X" tone={tone} />);
    expect((container.firstElementChild as HTMLElement).className).toContain(AVATAR_GRADIENTS[tone]);
  });

  it.each(["sm", "md", "lg", "xl"] as const)("applies the %s size", (size) => {
    const { container } = render(<Avatar initials="X" size={size} />);
    expect((container.firstElementChild as HTMLElement).className).toContain(AVATAR_SIZE_CLASSES[size]);
  });

  it("merges a custom className", () => {
    const { container } = render(<Avatar initials="X" className="custom" />);
    expect(container.firstElementChild).toHaveClass("custom");
  });
});
