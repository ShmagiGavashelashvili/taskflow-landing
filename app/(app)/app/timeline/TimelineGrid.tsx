import { format, parseISO } from "date-fns";
import Link from "next/link";
import { BAR_TONE_CLASSES } from "@/constants/tones";
import { projectPath, taskPath } from "@/lib/app-paths";
import type { Task } from "@/lib/schemas/entities";
import type { TimelineResponse } from "@/lib/schemas/timeline";
import { isOverdue, STATUS_LABELS } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { addDays } from "@/lib/weeks";

const COLUMNS = "grid-cols-[9rem_repeat(7,minmax(7.5rem,1fr))]";

/** A read-only week: one row per project, one column per day, tasks in the day they're due. */
export default function TimelineGrid({ timeline, today }: { timeline: TimelineResponse; today: string }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(timeline.from, index));
  const tasksOn = (projectId: string, day: string) =>
    timeline.tasks.filter((task) => task.projectId === projectId && task.dueDate === day);

  return (
    <div className="grid gap-3">
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <div role="table" aria-label="Tasks due this week by project" className="min-w-fit">
          <div role="row" className={cn("grid border-b border-line", COLUMNS)}>
            <span role="columnheader" className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
              Project
            </span>
            {days.map((day) => (
              <span
                key={day}
                role="columnheader"
                className={cn(
                  "border-l border-line px-3 py-2.5 text-xs font-semibold uppercase",
                  day === today ? "bg-tint text-brand" : "text-muted-foreground",
                )}
              >
                <time dateTime={day}>{format(parseISO(day), "EEE d")}</time>
                {day === today && <span className="sr-only"> (today)</span>}
              </span>
            ))}
          </div>
          {timeline.projects.map((project) => (
            <div key={project.id} role="row" className={cn("grid border-b border-line last:border-b-0", COLUMNS)}>
              <span role="rowheader" className="flex min-w-0 items-start gap-2 px-3 py-3">
                <span aria-hidden="true" className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", BAR_TONE_CLASSES[project.color])} />
                <Link href={projectPath(project.id)} className="text-sm font-semibold text-ink hover:text-brand">
                  {project.name}
                </Link>
              </span>
              {days.map((day) => (
                <div key={day} role="cell" className={cn("grid content-start gap-1.5 border-l border-line p-1.5", day === today && "bg-tint/40")}>
                  {tasksOn(project.id, day).map((task) => (
                    <TaskChip key={task.id} task={task} today={today} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {timeline.tasks.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Nothing is due this week.</p>
      )}
    </div>
  );
}

function TaskChip({ task, today }: { task: Task; today: string }) {
  const done = task.status === "done";
  const overdue = isOverdue(task, today);
  return (
    <Link
      href={taskPath(task)}
      title={`${task.title} · ${STATUS_LABELS[task.status]}`}
      className={cn(
        "block rounded-lg border bg-surface px-2 py-1.5 text-xs leading-snug font-medium shadow-xs transition-colors hover:border-brand/50",
        done ? "border-line text-muted-foreground line-through" : overdue ? "border-destructive/40 text-destructive" : "border-line text-ink",
      )}
    >
      <span className="line-clamp-2">{task.title}</span>
      <span className="sr-only">
        , {STATUS_LABELS[task.status]}
        {overdue && ", overdue"}
      </span>
    </Link>
  );
}
