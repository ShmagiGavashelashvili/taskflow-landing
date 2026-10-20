import { format, parseISO } from "date-fns";
import { CalendarDays, MessageSquare } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { TaskPriority } from "@/lib/schemas/entities";
import type { BoardTask } from "@/lib/schemas/tasks";
import { avatarToneOf, initialsOf } from "@/lib/people";
import { isOverdue, PRIORITY_LABELS } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { Assignee } from "./types";
import { PRIORITY_CLASSES } from "@/constants/tasks";

/** Small pieces of task metadata shared by the board card and the list view. */

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", PRIORITY_CLASSES[priority])}>
      <span className="sr-only">Priority: </span>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function DueDate({ task, today }: { task: Pick<BoardTask, "status" | "dueDate">; today: string }) {
  if (!task.dueDate) return null;
  const overdue = isOverdue(task, today);
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", overdue ? "font-semibold text-destructive" : "text-muted-foreground")}>
      <CalendarDays className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{overdue ? "Overdue, was due" : "Due"} </span>
      <time dateTime={task.dueDate}>{format(parseISO(task.dueDate), "MMM d")}</time>
    </span>
  );
}

export function CommentCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <MessageSquare className="size-3.5" aria-hidden="true" />
      {count}
      <span className="sr-only">{count === 1 ? "comment" : "comments"}</span>
    </span>
  );
}

export function AssigneeBadge({ member, showName = false }: { member: Assignee | undefined; showName?: boolean }) {
  if (!member) return showName ? <span className="text-sm text-muted-foreground">Unassigned</span> : null;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5" title={member.name}>
      <Avatar initials={initialsOf(member.name)} tone={avatarToneOf(member.id)} size="md" className="ring-0" />
      <span className={showName ? "truncate text-sm text-ink" : "sr-only"}>
        {showName ? member.name : `Assigned to ${member.name}`}
      </span>
    </span>
  );
}

/** Shown in place of the board or list when tasks couldn't load and there's nothing cached. */
export function TasksLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-line bg-surface p-8 text-center">
      <p className="font-semibold text-ink">Couldn&apos;t load tasks.</p>
      <button type="button" onClick={onRetry} className="mt-2 text-sm font-semibold text-brand hover:underline">
        Try again
      </button>
    </div>
  );
}
