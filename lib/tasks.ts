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
