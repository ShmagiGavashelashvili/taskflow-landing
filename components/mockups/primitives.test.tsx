import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Person, Tone } from "@/types";
import { BAR_TONE_CLASSES } from "@/constants/tones";
import { AvatarStack, Badge, ProgressBar, TaskCard, WindowFrame } from "./primitives";

const BADGE_CLASSES: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700",
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-600",
};

const people: Person[] = [
  { initials: "AK", tone: 0 },
  { initials: "JR", tone: 1 },
];

describe("WindowFrame", () => {
  it("wraps children, shows the url and is hidden from assistive tech", () => {
    const { container } = render(
      <WindowFrame url="app.taskflow.demo/x">
        <p>inside</p>
      </WindowFrame>,
    );
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("inside")).toBeInTheDocument();
    expect(screen.getByText("app.taskflow.demo/x")).toBeInTheDocument();
  });

  it("uses a default url and accepts a className", () => {
    const { container } = render(<WindowFrame className="extra">x</WindowFrame>);
    expect(screen.getByText("app.taskflow.demo")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("extra");
  });
});

describe("Badge", () => {
  it.each(Object.keys(BADGE_CLASSES) as Tone[])("applies the %s tone", (tone) => {
    render(<Badge tone={tone}>label</Badge>);
    expect(screen.getByText("label")).toHaveClass(...BADGE_CLASSES[tone].split(" "));
  });

  it("has a bar colour for every badge tone", () => {
    expect(Object.keys(BAR_TONE_CLASSES).sort()).toEqual(Object.keys(BADGE_CLASSES).sort());
  });
});

describe("ProgressBar", () => {
  it("sizes the fill to the value", () => {
    const { container } = render(<ProgressBar value={65} />);
    expect((container.firstElementChild?.firstElementChild as HTMLElement).style.width).toBe("65%");
  });

  it("defaults to blue and supports other tones", () => {
    const { container, rerender } = render(<ProgressBar value={10} />);
    expect(container.firstElementChild?.firstElementChild).toHaveClass("bg-blue-500");
    rerender(<ProgressBar value={10} tone="rose" />);
    expect(container.firstElementChild?.firstElementChild).toHaveClass("bg-rose-400");
  });

  it.each([0, 100])("handles the %i%% edge", (value) => {
    const { container } = render(<ProgressBar value={value} />);
    expect((container.firstElementChild?.firstElementChild as HTMLElement).style.width).toBe(`${value}%`);
  });
});

describe("AvatarStack", () => {
  it("renders one avatar per person", () => {
    render(<AvatarStack people={people} />);
    expect(screen.getByText("AK")).toBeInTheDocument();
    expect(screen.getByText("JR")).toBeInTheDocument();
  });

  it("renders nothing visible for an empty team", () => {
    const { container } = render(<AvatarStack people={[]} />);
    expect(container.firstElementChild?.children).toHaveLength(0);
  });
});

describe("TaskCard", () => {
  const base = { title: "Draft plan", tag: "Planning", tagTone: "blue" as const, due: "Oct 14", people };

  it("shows tag, title, due date and assignees", () => {
    render(<TaskCard {...base} />);
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByText("Draft plan")).toBeInTheDocument();
    expect(screen.getByText("Oct 14")).toBeInTheDocument();
    expect(screen.getByText("AK")).toBeInTheDocument();
  });

  it("shows a progress bar and percentage only when progress is given", () => {
    const { rerender, container } = render(<TaskCard {...base} />);
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    rerender(<TaskCard {...base} progress={40} />);
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(container.querySelector('[style*="width: 40%"]')).toBeInTheDocument();
  });

  it("shows progress of 0 (falsy but defined)", () => {
    render(<TaskCard {...base} progress={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("strikes through the title when done", () => {
    const { rerender } = render(<TaskCard {...base} />);
    expect(screen.getByText("Draft plan")).not.toHaveClass("line-through");
    rerender(<TaskCard {...base} done />);
    expect(screen.getByText("Draft plan")).toHaveClass("line-through");
  });
});
