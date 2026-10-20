import { TASK_STATUSES, type Task, type TaskPriority, type TaskStatus } from "@/lib/schemas/entities";

/**
 * Task rules shared by the server (the source of truth) and the client (optimistic updates and
 * highlighting), so both agree on ordering, completion and what counts as overdue.
 */

type Movable = Pick<Task, "id" | "status" | "position" | "completedAt">;

/** Board order: by column, then position. */
export function compareBoardOrder(a: Movable, b: Movable): number {
  return TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status) || a.position - b.position;
}

/**
 * Moves `taskId` to `position` in the `status` column and renumbers the columns it left and
 * entered from 0. Moving into done sets `completedAt` to `now`; moving out clears it. Returns a
 * new list in board order; tasks are copied only when they change. Unknown ids are a no-op.
 */
export function moveTask<T extends Movable>(
  tasks: readonly T[],
  taskId: string,
  to: { status: TaskStatus; position: number },
  now: Date,
): T[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return [...tasks];

  const column = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status && t.id !== taskId).sort(compareBoardOrder);
  const target = column(to.status);
  target.splice(Math.min(to.position, target.length), 0, task);

  const changes = new Map<string, Partial<Movable>>();
  const renumber = (list: T[]) =>
    list.forEach((t, position) => {
      if (t.position !== position || t.id === taskId) changes.set(t.id, { position });
    });
  renumber(target);
  if (task.status !== to.status) renumber(column(task.status));

  const completedAt =
    to.status === "done" ? (task.status === "done" ? task.completedAt : now.toISOString()) : null;
  changes.set(taskId, { ...changes.get(taskId), status: to.status, completedAt });

  return tasks
    .map((t) => {
      const change = changes.get(t.id);
      return change ? { ...t, ...change } : t;
    })
    .sort(compareBoardOrder);
}

type Editable = Movable & Pick<Task, "updatedAt">;

/** Fields a task edit may change. A status change without a position lands last in the column. */
export type TaskEdit = Partial<Pick<Task, "title" | "description" | "status" | "position" | "priority" | "assigneeId" | "dueDate">>;

/**
 * Applies an edit to `taskId` the way the server saves it: a status change (or an explicit
 * position) moves the task and renumbers its columns, moving into done sets `completedAt`, and
 * `updatedAt` becomes `now`. Returns a new list in board order. The server and optimistic
 * updates both call this, so they cannot disagree. Unknown ids are a no-op.
 */
export function editTask<T extends Editable>(tasks: readonly T[], taskId: string, edit: TaskEdit, now: Date): T[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return [...tasks];

  const { status, position, ...fields } = edit;
  const defined = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
  const moves = (status !== undefined && status !== task.status) || position !== undefined;
  const placed = moves
    ? moveTask(tasks, taskId, { status: status ?? task.status, position: position ?? Number.MAX_SAFE_INTEGER }, now)
    : [...tasks];
  return placed.map((t) => (t.id === taskId ? ({ ...t, ...defined, updatedAt: now.toISOString() } as T) : t));
}

/** Removes `taskId` and closes the gap in its column. Returns a new list in board order. */
export function removeTask<T extends Movable>(tasks: readonly T[], taskId: string): T[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return [...tasks];
  const remaining = tasks.filter((t) => t.id !== taskId).sort(compareBoardOrder);
  const column = remaining.filter((t) => t.status === task.status);
  return remaining.map((t) => {
    const position = column.indexOf(t);
    return position === -1 || t.position === position ? t : { ...t, position };
  });
}

/** The minimal patches that turn `before` into `after`, matched by id. Tasks missing from `after` are skipped. */
export function changedTasks<T extends { id: string }>(before: readonly T[], after: readonly T[]): { id: string; patch: Partial<Omit<T, "id">> }[] {
  const old = new Map(before.map((t) => [t.id, t]));
  return after.flatMap((next) => {
    const prev = old.get(next.id);
    if (!prev) return [];
    const patch = Object.fromEntries(
      (Object.keys(next) as (keyof T)[]).filter((key) => next[key] !== prev[key]).map((key) => [key, next[key]]),
    ) as Partial<Omit<T, "id">>;
    return Object.keys(patch).length > 0 ? [{ id: next.id, patch }] : [];
  });
}

/** Today's date (UTC) as `YYYY-MM-DD`, the calendar the API uses for due dates. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Open and due before `today` (`YYYY-MM-DD`, from `isoDate`). */
export function isOverdue(task: Pick<Task, "status" | "dueDate">, today: string): boolean {
  return task.status !== "done" && task.dueDate !== null && task.dueDate < today;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};
