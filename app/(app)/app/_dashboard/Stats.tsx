import { AlarmClock, CheckCircle2, CircleDot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { STATUS_BAR_CLASSES } from "@/constants/tasks";
import { TASK_STATUSES } from "@/lib/schemas/entities";
import type { DashboardStats } from "@/lib/schemas/dashboard";
import { STATUS_LABELS } from "@/lib/tasks";
import { cn } from "@/lib/utils";

/** Headline counts plus the split of tasks across board columns. */
export default function Stats({ stats }: { stats: DashboardStats }) {
  const total = TASK_STATUSES.reduce((sum, status) => sum + stats.byStatus[status], 0);

  return (
    <section aria-label="Task stats" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Open tasks" value={stats.open} icon={CircleDot} />
      <StatCard label="Completed this week" value={stats.completedThisWeek} icon={CheckCircle2} />
      <StatCard label="Overdue" value={stats.overdue} icon={AlarmClock} alert={stats.overdue > 0} />
      <div className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">By status</h2>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-tint" aria-hidden="true">
          {total > 0 &&
            TASK_STATUSES.map((status) => (
              <span
                key={status}
                className={STATUS_BAR_CLASSES[status]}
                style={{ width: `${(stats.byStatus[status] / total) * 100}%` }}
              />
            ))}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          {TASK_STATUSES.map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn("size-2 rounded-full", STATUS_BAR_CLASSES[status])} />
              <dt className="text-muted-foreground">{STATUS_LABELS[status]}</dt>
              <dd className="ml-auto font-semibold text-ink">{stats.byStatus[status]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function StatCard({ label, value, icon: Icon, alert = false }: { label: string; value: number; icon: LucideIcon; alert?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">{label}</h2>
        <Icon className={cn("size-4", alert ? "text-destructive" : "text-brand")} aria-hidden="true" />
      </div>
      <p className={cn("mt-2 text-3xl font-extrabold tracking-tight", alert ? "text-destructive" : "text-ink")}>{value}</p>
    </div>
  );
}
