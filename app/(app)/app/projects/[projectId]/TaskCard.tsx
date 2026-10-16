import { GripVertical } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, Ref } from "react";
import { taskPath } from "@/lib/app-paths";
import type { BoardTask } from "@/lib/schemas/tasks";
import { cn } from "@/lib/utils";
import { AssigneeBadge, CommentCount, DueDate, PriorityBadge } from "./TaskMeta";
import type { Assignee } from "./types";

interface TaskCardProps {
  task: BoardTask;
  assignee: Assignee | undefined;
  today: string;
  /** Props for the drag handle (dnd-kit's activator); omitted for the drag overlay. */
  handle?: ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> };
  dragging?: boolean;
  overlay?: boolean;
}

/** A board card: title (links to the task), priority, due date, comment count and assignee. */
export default function TaskCard({ task, assignee, today, handle, dragging, overlay }: TaskCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-line bg-surface p-3 shadow-xs transition-shadow",
        overlay ? "rotate-1 shadow-float" : "hover:shadow-card",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-1.5">
        <Link
          href={taskPath(task)}
          draggable={false}
          className="min-w-0 flex-1 text-sm font-semibold text-ink after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-brand/30"
        >
          {task.title}
        </Link>
        <button
          type="button"
          aria-label={`Move ${task.title}`}
          {...handle}
          className="relative z-10 -mt-0.5 -mr-1.5 cursor-grab rounded-md p-0.5 text-muted-foreground/60 hover:bg-tint hover:text-ink focus-visible:text-ink focus-visible:ring-[3px] focus-visible:ring-brand/30 focus-visible:outline-none active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <PriorityBadge priority={task.priority} />
        <DueDate task={task} today={today} />
        <CommentCount count={task.commentCount} />
        <span className="ml-auto">
          <AssigneeBadge member={assignee} />
        </span>
      </div>
    </div>
  );
}
