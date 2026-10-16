import type { AppSession } from "@/server/auth/session";

/**
 * SLOT (#5): the sidebar's project list. Rendered inside `<Suspense fallback={<SidebarProjectsSkeleton />}>`
 * with the resolved session, so it can call the project service directly. Replace the body
 * with the workspace's active projects (links to `/app/projects/[projectId]`) and a
 * "New project" action.
 */
export default async function SidebarProjects({ session }: { session: AppSession }) {
  return (
    <SidebarSection>
      <p className="px-2.5 py-1.5 text-sm text-muted-foreground">No projects in {session.workspace.name} yet.</p>
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
      <h2 id="sidebar-projects-heading" className="px-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Projects
      </h2>
      {children}
    </section>
  );
}
