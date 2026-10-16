import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/ui/sonner";
import { taskQueries } from "@/lib/api/tasks";
import { TASK_STATUSES } from "@/lib/schemas/entities";
import type { BoardTask } from "@/lib/schemas/tasks";
import { errorResponse, jsonResponse, sentRequest, stubFetch } from "@/tests/fetch";
import Board from "./Board";

const MEMBERS = [
  { id: "usr_demo", name: "Alex Morgan" },
  { id: "usr_priya", name: "Priya Shah" },
];

function task(id: string, title: string, status: BoardTask["status"], position: number): BoardTask {
  return {
    id,
    projectId: "prj_website",
    title,
    description: "",
    status,
    position,
    priority: "medium",
    assigneeId: "usr_priya",
    dueDate: null,
    createdBy: "usr_demo",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    completedAt: null,
    commentCount: 0,
  };
}

const TASKS = [
  task("t_copy", "Write homepage copy", "todo", 0),
  task("t_cms", "Set up CMS", "todo", 1),
  task("t_nav", "Build navbar", "in_progress", 0),
];

/**
 * jsdom has no layout, and dnd-kit's keyboard sensor moves between droppables by their
 * rectangles. Lay the board out like the real one: four 300px columns, cards stacked in them.
 * Elements are recognised by the board's `data-board-column` / `data-card-*` attributes.
 */
function layOutBoard() {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    // The drag overlay's wrapper measures as the card inside it, which starts where the card was.
    const el = (this instanceof HTMLElement && !this.dataset.boardColumn && !this.dataset.cardStatus
      ? (this.firstElementChild ?? this)
      : this) as HTMLElement;
    const column = TASK_STATUSES.indexOf((el.dataset.boardColumn ?? el.dataset.cardStatus) as BoardTask["status"]);
    if (column === -1) return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
    if (el.dataset.boardColumn) return DOMRect.fromRect({ x: column * 300, y: 0, width: 280, height: 800 });
    const index = Number(el.dataset.cardIndex);
    return DOMRect.fromRect({ x: column * 300 + 10, y: 60 + index * 100, width: 260, height: 80 });
  });
}

function renderBoard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  // What the server-rendered first load seeds.
  queryClient.setQueryData(taskQueries.list("prj_website").queryKey, TASKS);
  render(
    <QueryClientProvider client={queryClient}>
      <Board projectId="prj_website" filters={{}} members={MEMBERS} today="2026-10-14" />
      <Toaster />
    </QueryClientProvider>,
  );
}

const column = (name: string) => within(screen.getByRole("region", { name: new RegExp(`^${name}`) }));

/** Picks the card up with Space, moves it one column right and drops it. */
async function moveRightWithKeyboard(title: string) {
  const user = userEvent.setup();
  screen.getByRole("button", { name: `Move ${title}` }).focus();
  await user.keyboard(" ");
  await user.keyboard("{ArrowRight}");
  await user.keyboard(" ");
}

function deferred() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(() => {
  layOutBoard();
});

describe("Board keyboard moves", () => {
  it("moves a card to the next column straight away and saves it", async () => {
    const save = deferred();
    const moved = { ...TASKS[0], status: "in_progress" as const, position: 0 };
    const fetchMock = stubFetch((path, init) => {
      if (init.method === "POST") return save.promise;
      return jsonResponse([TASKS[1], moved, { ...TASKS[2], position: 1 }]);
    });
    renderBoard();
    expect(column("To do").getByText("Write homepage copy")).toBeInTheDocument();

    await moveRightWithKeyboard("Write homepage copy");

    // Optimistic: shown in the new column before the server answers.
    expect(column("In progress").getByText("Write homepage copy")).toBeInTheDocument();
    expect(column("To do").queryByText("Write homepage copy")).not.toBeInTheDocument();
    expect(sentRequest(fetchMock)).toEqual({
      path: "/api/tasks/t_copy/move",
      method: "POST",
      body: { status: "in_progress", position: 0 },
    });
    expect(screen.getByText(/dropped into In progress/i)).toBeInTheDocument();

    await act(async () => save.resolve(jsonResponse(moved)));

    expect(column("In progress").getByText("Write homepage copy")).toBeInTheDocument();
    expect(screen.queryByText(/couldn't move/i)).not.toBeInTheDocument();
  });

  it("puts the card back and explains when saving fails", async () => {
    const save = deferred();
    stubFetch((path, init) => {
      if (init.method === "POST") return save.promise;
      return new Promise<Response>(() => {}); // the refetch never lands: the rollback must come from the cache
    });
    renderBoard();

    await moveRightWithKeyboard("Write homepage copy");
    expect(column("In progress").getByText("Write homepage copy")).toBeInTheDocument();

    await act(async () => save.resolve(errorResponse(503, "UNAVAILABLE", "The service is temporarily unavailable.")));

    expect(await screen.findByText(/couldn't move “Write homepage copy”/i)).toBeInTheDocument();
    expect(column("To do").getByText("Write homepage copy")).toBeInTheDocument();
    expect(column("In progress").queryByText("Write homepage copy")).not.toBeInTheDocument();
  });
});
