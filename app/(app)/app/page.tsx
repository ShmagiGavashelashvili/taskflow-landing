import type { Metadata } from "next";
import { Suspense } from "react";
import { getAppSession } from "@/server/auth/app-session";

export const metadata: Metadata = { title: "Dashboard · TaskFlow" };

/** Placeholder dashboard; #7 replaces the body with stats, my tasks, workload and progress. */
export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Suspense fallback={<div className="h-9 w-64 rounded-lg bg-tint" aria-hidden="true" />}>
        <Greeting />
      </Suspense>
      <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-muted-foreground">
        Your dashboard is on its way: stats, your tasks and project progress will show up here.
      </div>
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
