import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { showcaseTabs } from "@/data";
import ShowcaseTabs from "./ShowcaseTabs";

const panels = {
  board: <div data-testid="board-mockup">board</div>,
  timeline: <div data-testid="timeline-mockup">timeline</div>,
  reports: <div data-testid="reports-mockup">reports</div>,
};

const renderTabs = () => render(<ShowcaseTabs tabs={showcaseTabs} panels={panels} />);
const tab = (name: string) => screen.getByRole("tab", { name });

describe("ShowcaseTabs", () => {
  it("renders an accessible tablist with Board, Timeline and Reports", () => {
    renderTabs();
    expect(screen.getByRole("tablist", { name: "Product views" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Board", "Timeline", "Reports"]);
  });

  it("selects Board first and shows its mockup and description", () => {
    renderTabs();
    expect(tab("Board")).toHaveAttribute("aria-selected", "true");
    expect(tab("Timeline")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("board-mockup")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: showcaseTabs[0].title })).toBeInTheDocument();
    for (const h of showcaseTabs[0].highlights) expect(screen.getByText(h)).toBeInTheDocument();
  });

  it("uses roving tabindex so only the selected tab is in the tab order", () => {
    renderTabs();
    expect(tab("Board")).toHaveAttribute("tabindex", "0");
    expect(tab("Timeline")).toHaveAttribute("tabindex", "-1");
    expect(tab("Reports")).toHaveAttribute("tabindex", "-1");
  });

  it("links each tab to the single tabpanel, which is labelled by the active tab", () => {
    renderTabs();
    for (const t of screen.getAllByRole("tab")) expect(t).toHaveAttribute("aria-controls", "showcase-panel");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("id", "showcase-panel");
    expect(panel).toHaveAttribute("aria-labelledby", "showcase-tab-board");
  });

  it("switches the mockup, copy and aria state when a tab is clicked", async () => {
    const user = userEvent.setup();
    renderTabs();
    await user.click(tab("Timeline"));
    expect(tab("Timeline")).toHaveAttribute("aria-selected", "true");
    expect(tab("Board")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "showcase-tab-timeline");
    await waitFor(() => expect(screen.getByTestId("timeline-mockup")).toBeInTheDocument(), { timeout: 3000 });
    await waitFor(() => expect(screen.queryByTestId("board-mockup")).not.toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByRole("heading", { level: 3, name: showcaseTabs[1].title })).toBeInTheDocument();
  });

  it("supports every tab via click", async () => {
    const user = userEvent.setup();
    renderTabs();
    await user.click(tab("Reports"));
    await waitFor(() => expect(screen.getByTestId("reports-mockup")).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByRole("heading", { level: 3, name: showcaseTabs[2].title })).toBeInTheDocument();
  });

  describe("keyboard navigation", () => {
    it("ArrowRight moves to the next tab and focuses it", async () => {
      const user = userEvent.setup();
      renderTabs();
      tab("Board").focus();
      await user.keyboard("{ArrowRight}");
      expect(tab("Timeline")).toHaveAttribute("aria-selected", "true");
      expect(tab("Timeline")).toHaveFocus();
    });

    it("ArrowLeft wraps from the first tab to the last", async () => {
      const user = userEvent.setup();
      renderTabs();
      tab("Board").focus();
      await user.keyboard("{ArrowLeft}");
      expect(tab("Reports")).toHaveAttribute("aria-selected", "true");
      expect(tab("Reports")).toHaveFocus();
    });

    it("ArrowRight wraps from the last tab to the first", async () => {
      const user = userEvent.setup();
      renderTabs();
      tab("Board").focus();
      await user.keyboard("{End}{ArrowRight}");
      expect(tab("Board")).toHaveAttribute("aria-selected", "true");
    });

    it("Home and End jump to the first and last tabs", async () => {
      const user = userEvent.setup();
      renderTabs();
      tab("Board").focus();
      await user.keyboard("{End}");
      expect(tab("Reports")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(tab("Board")).toHaveFocus();
    });

    it("ignores unrelated keys", async () => {
      const user = userEvent.setup();
      renderTabs();
      tab("Board").focus();
      await user.keyboard("a{ArrowDown}");
      expect(tab("Board")).toHaveAttribute("aria-selected", "true");
    });
  });
});
