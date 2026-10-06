import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TIMELINE_DAY_LABELS, TIMELINE_DAYS, TIMELINE_ROWS } from "@/constants/mockups";
import TimelineMockup from "./TimelineMockup";

describe("TimelineMockup", () => {
  it("is decorative and shows the title, range and url", () => {
    const { container } = render(<TimelineMockup />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Website Relaunch · Timeline")).toBeInTheDocument();
    expect(screen.getByText("Oct 7 – Oct 20")).toBeInTheDocument();
    expect(screen.getByText("app.taskflow.demo/timeline")).toBeInTheDocument();
  });

  it("renders a header cell for every day", () => {
    const { container } = render(<TimelineMockup />);
    const header = container.querySelector(".grid-cols-14.text-center") as HTMLElement;
    expect(header.children).toHaveLength(TIMELINE_DAYS);
    expect(header.textContent).toBe(TIMELINE_DAY_LABELS.join(""));
  });

  it("renders every phase row by name", () => {
    render(<TimelineMockup />);
    for (const row of TIMELINE_ROWS) expect(screen.getByText(row.name)).toBeInTheDocument();
  });

  it("places each bar on the grid from its start to end column", () => {
    render(<TimelineMockup />);
    for (const row of TIMELINE_ROWS) {
      const label = screen.getByText(row.name);
      const track = label.nextElementSibling as HTMLElement;
      const bar = track.querySelector('[style*="grid-column"]') as HTMLElement;
      expect(bar.style.gridColumn).toBe(`${row.start} / ${row.end}`);
    }
  });

  it("fills each bar to its progress, including 0%", () => {
    render(<TimelineMockup />);
    for (const row of TIMELINE_ROWS) {
      const track = screen.getByText(row.name).nextElementSibling as HTMLElement;
      const fill = track.querySelector('[style*="grid-column"] > div') as HTMLElement;
      expect(fill.style.width).toBe(`${row.progress}%`);
    }
  });

  it("draws a divider between days but not before the first", () => {
    const { container } = render(<TimelineMockup />);
    const track = screen.getByText(TIMELINE_ROWS[0].name).nextElementSibling as HTMLElement;
    const dividers = track.querySelectorAll("span.absolute");
    expect(dividers).toHaveLength(TIMELINE_DAYS);
    expect(dividers[0]).toHaveClass("hidden");
    expect(container.querySelectorAll("span.absolute.hidden").length).toBe(TIMELINE_ROWS.length);
  });

  it("shows the status footer", () => {
    render(<TimelineMockup />);
    expect(screen.getByText(/On track/)).toBeInTheDocument();
  });
});
