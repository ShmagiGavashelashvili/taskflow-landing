import type { Metadata } from "next";
import { Suspense } from "react";
import PlanUpgradeCard from "@/components/app/PlanUpgradeCard";
import { isoDate } from "@/lib/tasks";
import { getAppSession } from "@/server/auth/app-session";
import { getContainer } from "@/server/container";
import { gated } from "@/server/domain/plan-locked";
import { dashboardService } from "@/server/services/dashboard";
import MyTasks from "./_dashboard/MyTasks";
import { ProjectProgress, Workload } from "./_dashboard/Reports";
import Stats from "./_dashboard/Stats";
import { pageTitle } from "@/lib/page-title";

export const metadata: Metadata = { title: pageTitle("Dashboard") };

/** Stats and the user's tasks on every plan; workload and project progress (reports) on Pro and Business. */
export default function DashboardPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <Suspense fallback={<div className="h-9 w-64 rounded-lg bg-tint" aria-hidden="true" />}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Greeting() {
  const { user, workspace } = await getAppSession();
  const firstName = user.name.split(/\s+/)[0];
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Welcome back, {firstName}</h1>
      <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening in {workspace.name}.</p>
    </div>
  );
}

async function Dashboard() {
  const session = await getAppSession();
  const container = getContainer();
  const dashboard = dashboardService(container);
  const [overview, reports] = await Promise.all([dashboard.overview(session), gated(dashboard.reports(session))]);
  const today = isoDate(container.clock.now());

  return (
    <>
      <Stats stats={overview.stats} />
      {reports.locked ? (
        <>
          <MyTasks tasks={overview.myTasks} projects={overview.projects} today={today} />
          <PlanUpgradeCard title="See workload and project progress" message={reports.message} />
        </>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <MyTasks tasks={overview.myTasks} projects={overview.projects} today={today} />
            </div>
            <div className="lg:col-span-2">
              <Workload rows={reports.data.workload} />
            </div>
          </div>
          <ProjectProgress projects={reports.data.projects} />
        </>
      )}
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className="h-28 rounded-2xl bg-tint/60" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-tint/50" />
    </div>
  );
}
