import type { Metadata } from "next";
import { Suspense } from "react";
import PlanUpgradeCard from "@/components/app/PlanUpgradeCard";
import { dueDateSchema } from "@/lib/schemas/entities";
import { isoDate } from "@/lib/tasks";
import { addDays, weekStart } from "@/lib/weeks";
import { getAppSession } from "@/server/auth/app-session";
import { getContainer } from "@/server/container";
import { gated } from "@/server/domain/plan-locked";
import { projectService } from "@/server/services/projects";
import { timelineService } from "@/server/services/timeline";
import TimelineGrid from "./TimelineGrid";
import TimelineToolbar from "./TimelineToolbar";

export const metadata: Metadata = { title: "Timeline · TaskFlow" };

/** Tasks due in a week, grouped by project. `?week=<any date in it>&project=<id>`; read-only. */
export default function TimelinePage({ searchParams }: PageProps<"/app/timeline">) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Timeline</h1>
        <p className="mt-1 text-muted-foreground">Deadlines across your projects, a week at a time.</p>
      </div>
      <Suspense fallback={<TimelineSkeleton />}>
        <Timeline searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Timeline({ searchParams }: Pick<PageProps<"/app/timeline">, "searchParams">) {
  const { week, project } = await searchParams;
  const session = await getAppSession();
  const container = getContainer();
  const today = isoDate(container.clock.now());
  const thisWeek = weekStart(today);
  const from = typeof week === "string" && dueDateSchema.safeParse(week).success ? weekStart(week) : thisWeek;

  const projects = await projectService(container).list(session, { archived: false });
  // An unknown or archived project in the URL falls back to all projects.
  const projectId = typeof project === "string" && projects.some((p) => p.id === project) ? project : null;

  const timeline = await gated(
    timelineService(container).list(session, { from, to: addDays(from, 6), projectId: projectId ?? undefined }),
  );
  if (timeline.locked) {
    return <PlanUpgradeCard title="Plan around deadlines with the timeline" message={timeline.message} />;
  }

  return (
    <>
      <TimelineToolbar
        projects={projects.map(({ id, name, color }) => ({ id, name, color }))}
        projectId={projectId}
        week={from}
        thisWeek={thisWeek}
      />
      <TimelineGrid timeline={timeline.data} today={today} />
    </>
  );
}

function TimelineSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading timeline">
      <div className="h-9 w-full max-w-md rounded-lg bg-tint/70" />
      <div className="h-72 rounded-2xl bg-tint/50" />
    </div>
  );
}
