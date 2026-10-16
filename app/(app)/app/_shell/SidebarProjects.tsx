import Link from "next/link";
import { Suspense } from "react";
import { PROJECTS_PATH } from "@/lib/app-paths";
import type { AppSession } from "@/server/auth/session";
import { getContainer } from "@/server/container";
import { withFallback } from "@/server/render";
import { projectService } from "@/server/services/projects";
import NewProjectButton from "../projects/NewProjectButton";
import { SidebarProjectLinks, StaticSidebarProjectLinks } from "./SidebarProjectLinks";

/**
 * The sidebar's project list: the workspace's active projects, a link to all projects
 * (including archived ones) and "New project". Rendered inside
 * `<Suspense fallback={<SidebarProjectsSkeleton />}>` with the resolved session.
 */
export default async function SidebarProjects({ session }: { session: AppSession }) {
  const active = await withFallback(() => projectService(getContainer()).list(session, { archived: false }), null);
  if (!active) return <SidebarProjectsUnavailable />;
  const projects = active.map(({ id, name, color }) => ({ id, name, color }));

  return (
    <SidebarSection>
      {projects.length === 0 ? (
        <p className="px-2.5 py-1.5 text-sm text-muted-foreground">No active projects yet.</p>
      ) : (
        <Suspense fallback={<StaticSidebarProjectLinks projects={projects} />}>
          <SidebarProjectLinks projects={projects} />
        </Suspense>
      )}
      <NewProjectButton compact />
    </SidebarSection>
  );
}

/** Shown instead of the list when it can't be loaded; the rest of the shell keeps working. */
export function SidebarProjectsUnavailable() {
  return (
    <SidebarSection>
      <p className="px-2.5 py-1.5 text-sm text-muted-foreground">Couldn&apos;t load projects. Refresh to try again.</p>
    </SidebarSection>
  );
}

export function SidebarProjectsSkeleton() {
  return (
    <SidebarSection>
      <div className="grid gap-1.5 px-2.5 py-1" aria-hidden="true">
        <div className="h-4 w-32 rounded bg-tint" />
        <div className="h-4 w-24 rounded bg-tint" />
      </div>
    </SidebarSection>
  );
}

function SidebarSection({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="sidebar-projects-heading" className="grid gap-1">
      <div className="flex items-center justify-between px-2.5">
        <h2 id="sidebar-projects-heading" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Projects
        </h2>
        <Link href={PROJECTS_PATH} className="text-xs font-medium text-muted-foreground hover:text-brand">
          View all
        </Link>
      </div>
      {children}
    </section>
  );
}
