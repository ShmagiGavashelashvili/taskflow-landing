import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { BAR_TONE_CLASSES } from "@/constants/tones";
import { projectPath } from "@/lib/app-paths";
import type { DashboardReportsResponse } from "@/lib/schemas/dashboard";
import { avatarToneOf, initialsOf } from "@/lib/people";
import { cn } from "@/lib/utils";

/** Open tasks per member (bars relative to the busiest row), including unassigned work. */
export function Workload({ rows }: { rows: DashboardReportsResponse["workload"] }) {
  const busiest = Math.max(1, ...rows.map((row) => row.open));

  return (
    <section aria-labelledby="workload" className="rounded-2xl border border-line bg-surface">
      <h2 id="workload" className="border-b border-line px-4 py-3 font-bold text-ink">
        Workload
      </h2>
      <ul className="grid gap-3 p-4">
        {rows.map((row) => (
          <li key={row.member?.id ?? "unassigned"} className="grid gap-1.5">
            <div className="flex items-center gap-2 text-sm">
              {row.member ? (
                <Avatar initials={initialsOf(row.member.name)} tone={avatarToneOf(row.member.id)} size="md" className="ring-0" />
              ) : (
                <span aria-hidden="true" className="size-6 rounded-full border border-dashed border-line" />
              )}
              <span className={cn("truncate font-semibold", row.member ? "text-ink" : "text-muted-foreground")}>
                {row.member?.name ?? "Unassigned"}
              </span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {row.open} open
                {row.overdue > 0 && <span className="font-semibold text-destructive"> · {row.overdue} overdue</span>}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-tint" aria-hidden="true">
              <div
                className={cn("h-full rounded-full", row.member ? "bg-brand" : BAR_TONE_CLASSES.slate)}
                style={{ width: `${(row.open / busiest) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Completion per active project. */
export function ProjectProgress({ projects }: { projects: DashboardReportsResponse["projects"] }) {
  return (
    <section aria-labelledby="project-progress" className="rounded-2xl border border-line bg-surface">
      <h2 id="project-progress" className="border-b border-line px-4 py-3 font-bold text-ink">
        Project progress
      </h2>
      {projects.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No active projects yet.</p>
      ) : (
        <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(({ project, total, done, percent }) => (
            <li key={project.id} className="grid gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <Link href={projectPath(project.id)} className="truncate text-sm font-semibold text-ink hover:text-brand">
                  {project.name}
                </Link>
                <span className="shrink-0 text-sm font-bold text-ink">{percent}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={`${project.name} completion`}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-tint"
              >
                <div className={cn("h-full rounded-full", BAR_TONE_CLASSES[project.color])} style={{ width: `${percent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {done} of {total} tasks done
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
