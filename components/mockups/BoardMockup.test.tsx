import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BOARD_COLUMNS } from "./board.data";
import BoardMockup from "./BoardMockup";

describe("BoardMockup", () => {
  it("is decorative: the whole mockup is hidden from assistive tech", () => {
    const { container } = render(<BoardMockup />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the project header", () => {
    render(<BoardMockup />);
    expect(screen.getByText("Website Relaunch")).toBeInTheDocument();
    expect(screen.getByText(/Sprint 14/)).toBeInTheDocument();
    expect(screen.getByText("Task")).toBeInTheDocument();
  });

  it("renders every column with its card count", () => {
    render(<BoardMockup />);
    for (const column of BOARD_COLUMNS) {
      const heading = screen.getByText(column.name);
      expect(heading.parentElement).toHaveTextContent(String(column.cards.length));
    }
  });

  it("renders every card title", () => {
    render(<BoardMockup />);
    for (const card of BOARD_COLUMNS.flatMap((c) => c.cards)) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
  });

  it("marks completed cards with a strikethrough", () => {
    render(<BoardMockup />);
    for (const card of BOARD_COLUMNS.flatMap((c) => c.cards)) {
      const el = screen.getByText(card.title);
      if (card.done) expect(el).toHaveClass("line-through");
      else expect(el).not.toHaveClass("line-through");
    }
  });

  it("shows progress only on in-progress cards", () => {
    render(<BoardMockup />);
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("collapses responsively: the Done column and 3rd cards are hidden on small screens", () => {
    render(<BoardMockup />);
    const doneColumn = screen.getByText("Done").closest("div.hidden");
    expect(doneColumn).toHaveClass("lg:block");
    const thirdCard = screen.getByText(BOARD_COLUMNS[0].cards[2].title).closest("div.hidden");
    expect(thirdCard).toHaveClass("sm:block");
    const firstCard = screen.getByText(BOARD_COLUMNS[0].cards[0].title).closest("div.hidden");
    expect(firstCard).toBeNull();
  });

  it("accepts a className", () => {
    const { container } = render(<BoardMockup className="mine" />);
    expect(container.firstElementChild).toHaveClass("mine");
  });

  it("renders the team avatars in the header", () => {
    const { container } = render(<BoardMockup />);
    const header = container.querySelector(".flex.items-center.gap-2") as HTMLElement;
    expect(within(header).getByText("AK")).toBeInTheDocument();
  });
});
