import { format, parseISO } from "date-fns";
import Link from "next/link";
import { BAR_TONE_CLASSES } from "@/constants/tones";
import { taskPath } from "@/lib/app-paths";
import type { Task } from "@/lib/schemas/entities";
import type { ProjectRef } from "@/lib/schemas/dashboard";
import { isOverdue, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/tasks";
import { cn } from "@/lib/utils";

/** The signed-in user's open tasks, soonest due first. */
export default function MyTasks({ tasks, projects, today }: { tasks: Task[]; projects: ProjectRef[]; today: string }) {
  const projectsById = new Map(projects.map((project) => [project.id, project]));

  return (
    <section aria-labelledby="my-tasks" className="rounded-2xl border border-line bg-surface">
      <h2 id="my-tasks" className="border-b border-line px-4 py-3 font-bold text-ink">
        My open tasks <span className="font-semibold text-muted-foreground">({tasks.length})</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing assigned to you right now.</p>
      ) : (
        <ul className="divide-y divide-line">
          {tasks.map((task) => {
            const project = projectsById.get(task.projectId);
            const overdue = isOverdue(task, today);
            return (
              <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <Link href={taskPath(task)} className="block truncate text-sm font-semibold text-ink hover:text-brand">
                    {task.title}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {project && (
                      <>
                        <span aria-hidden="true" className={cn("size-2 rounded-full", BAR_TONE_CLASSES[project.color])} />
                        <span className="truncate">{project.name}</span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{STATUS_LABELS[task.status]}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      <span className="sr-only">Priority: </span>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </p>
                </div>
                {task.dueDate && (
                  <span className={cn("shrink-0 text-xs", overdue ? "font-semibold text-destructive" : "text-muted-foreground")}>
                    <span className="sr-only">{overdue ? "Overdue, was due " : "Due "}</span>
                    <time dateTime={task.dueDate}>{task.dueDate === today ? "Today" : format(parseISO(task.dueDate), "MMM d")}</time>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
