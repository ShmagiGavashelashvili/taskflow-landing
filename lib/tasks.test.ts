import { describe, expect, it } from "vitest";
import type { Task } from "@/lib/schemas/entities";
import { changedTasks, editTask, moveTask, removeTask } from "./tasks";

const now = new Date("2026-10-20T12:00:00.000Z");
const earlier = "2026-10-01T00:00:00.000Z";

const task = (id: string, status: Task["status"], position: number, extra: Partial<Task> = {}): Task => ({
  id,
  projectId: "prj_1",
  title: id,
  description: "",
  status,
  priority: "medium",
  assigneeId: null,
  dueDate: null,
  position,
  createdBy: "usr_1",
  createdAt: earlier,
  updatedAt: earlier,
  completedAt: status === "done" ? earlier : null,
  ...extra,
});

const board = () => [task("a", "todo", 0), task("b", "todo", 1), task("c", "todo", 2), task("d", "done", 0)];
const placement = (tasks: Task[]) => tasks.map((t) => `${t.id}:${t.status}:${t.position}`);

describe("moveTask", () => {
  it("renumbers both columns and sets completedAt when moving into done", () => {
    const moved = moveTask(board(), "a", { status: "done", position: 0 }, now);
    expect(placement(moved)).toEqual(["b:todo:0", "c:todo:1", "a:done:0", "d:done:1"]);
    expect(moved.find((t) => t.id === "a")!.completedAt).toBe(now.toISOString());
  });
});

describe("editTask", () => {
  it("moves a status change to the end of the new column, like move", () => {
    const edited = editTask(board(), "a", { status: "done" }, now);
    const moved = moveTask(board(), "a", { status: "done", position: Number.MAX_SAFE_INTEGER }, now);
    expect(placement(edited)).toEqual(placement(moved));
    expect(edited.find((t) => t.id === "a")!.completedAt).toBe(now.toISOString());
  });

  it("changes fields without moving when the status is unchanged", () => {
    const edited = editTask(board(), "b", { title: "New", status: "todo" }, now);
    expect(placement(edited)).toEqual(placement(board()));
    expect(edited.find((t) => t.id === "b")).toMatchObject({ title: "New", updatedAt: now.toISOString() });
  });

  it("ignores undefined fields", () => {
    const edited = editTask(board(), "b", { title: undefined }, now);
    expect(edited.find((t) => t.id === "b")!.title).toBe("b");
  });

  it("stamps updatedAt on an in-column move", () => {
    const edited = editTask(board(), "c", { status: "todo", position: 0 }, now);
    expect(placement(edited).slice(0, 3)).toEqual(["c:todo:0", "a:todo:1", "b:todo:2"]);
    expect(edited.find((t) => t.id === "c")!.updatedAt).toBe(now.toISOString());
  });

  it("is a no-op for an unknown id", () => {
    expect(editTask(board(), "zzz", { title: "x" }, now)).toEqual(board());
  });
});

describe("removeTask", () => {
  it("closes the gap in the task's column only", () => {
    expect(placement(removeTask(board(), "a"))).toEqual(["b:todo:0", "c:todo:1", "d:done:0"]);
  });
});

describe("changedTasks", () => {
  it("returns only the fields that differ", () => {
    const before = board();
    const after = removeTask(before, "a");
    expect(changedTasks(before, after)).toEqual([
      { id: "b", patch: { position: 0 } },
      { id: "c", patch: { position: 1 } },
    ]);
  });
});
