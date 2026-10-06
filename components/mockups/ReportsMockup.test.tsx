import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BURNDOWN_ACTUAL, BURNDOWN_IDEAL, KPIS, VELOCITY } from "@/constants/mockups";
import ReportsMockup from "./ReportsMockup";

describe("ReportsMockup", () => {
  it("is decorative and shows the heading and url", () => {
    const { container } = render(<ReportsMockup />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Team performance · Last 6 weeks")).toBeInTheDocument();
    expect(screen.getByText("app.taskflow.demo/reports")).toBeInTheDocument();
  });

  it("renders every KPI with value and delta", () => {
    render(<ReportsMockup />);
    for (const kpi of KPIS) {
      expect(screen.getByText(kpi.label)).toBeInTheDocument();
      expect(screen.getByText(kpi.value)).toBeInTheDocument();
      expect(screen.getByText(kpi.delta)).toBeInTheDocument();
    }
  });

  it("renders a velocity bar per week, scaled relative to the maximum", () => {
    const { container } = render(<ReportsMockup />);
    const max = Math.max(...VELOCITY.map((v) => v.value));
    for (const point of VELOCITY) {
      const bar = screen.getByText(point.week).previousElementSibling?.firstElementChild as HTMLElement;
      expect(bar.style.height).toBe(`${(point.value / max) * 100}%`);
    }
    expect(container.textContent).toContain("Velocity");
  });

  it("makes the tallest velocity bar exactly 100%", () => {
    render(<ReportsMockup />);
    const tallest = VELOCITY.reduce((a, b) => (b.value > a.value ? b : a));
    const bar = screen.getByText(tallest.week).previousElementSibling?.firstElementChild as HTMLElement;
    expect(bar.style.height).toBe("100%");
  });

  it("draws the burndown chart with ideal and actual lines and a legend", () => {
    const { container } = render(<ReportsMockup />);
    expect(screen.getByText("Sprint burndown")).toBeInTheDocument();
    expect(screen.getByText("Ideal")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    const lines = container.querySelectorAll("polyline");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveAttribute("points", BURNDOWN_IDEAL);
    expect(lines[1]).toHaveAttribute("points", BURNDOWN_ACTUAL);
  });
});
