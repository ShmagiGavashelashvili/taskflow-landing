import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TimelineToolbar from "./TimelineToolbar";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const projects = [
  { id: "prj_website", name: "Website Relaunch", color: "blue" as const },
  { id: "prj_mobile", name: "Mobile App v2", color: "violet" as const },
];

beforeEach(() => {
  router.push.mockReset();
  // Radix Select uses pointer capture, which jsdom lacks.
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
});

describe("TimelineToolbar", () => {
  it("links to the previous, current and next week, keeping the project filter", () => {
    render(<TimelineToolbar projects={projects} projectId="prj_mobile" week="2026-10-19" thisWeek="2026-10-12" />);

    expect(screen.getByRole("link", { name: "Previous week" })).toHaveAttribute("href", "/app/timeline?project=prj_mobile");
    expect(screen.getByRole("link", { name: "Next week" })).toHaveAttribute(
      "href",
      "/app/timeline?week=2026-10-26&project=prj_mobile",
    );
    expect(screen.getByRole("link", { name: "This week" })).toHaveAttribute("href", "/app/timeline?project=prj_mobile");
    expect(screen.getByRole("heading", { name: "Oct 19 – Oct 25, 2026" })).toBeInTheDocument();
  });

  it("filters by project and back to all projects, keeping the week", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TimelineToolbar projects={projects} projectId={null} week="2026-10-19" thisWeek="2026-10-12" />,
    );

    await user.click(screen.getByRole("combobox", { name: "Filter by project" }));
    await user.click(screen.getByRole("option", { name: "Mobile App v2" }));
    expect(router.push).toHaveBeenLastCalledWith("/app/timeline?week=2026-10-19&project=prj_mobile");

    rerender(<TimelineToolbar projects={projects} projectId="prj_mobile" week="2026-10-19" thisWeek="2026-10-12" />);
    await user.click(screen.getByRole("combobox", { name: "Filter by project" }));
    await user.click(screen.getByRole("option", { name: "All projects" }));
    expect(router.push).toHaveBeenLastCalledWith("/app/timeline?week=2026-10-19");
  });
});
