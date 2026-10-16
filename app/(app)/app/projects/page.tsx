import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BAR_TONE_CLASSES } from "@/constants/tones";
import { projectPath } from "@/lib/app-paths";
import type { Project } from "@/lib/schemas/entities";
import { cn } from "@/lib/utils";
import { getAppSession } from "@/server/auth/app-session";
import { getContainer } from "@/server/container";
import { projectService } from "@/server/services/projects";
import NewProjectButton from "./NewProjectButton";
import UnarchiveButton from "./UnarchiveButton";

export const metadata: Metadata = { title: "Projects · TaskFlow" };

/** Every project in the workspace: active ones, and archived ones that can be restored. */
export default function ProjectsPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Projects</h1>
        <NewProjectButton />
      </div>
      <Suspense fallback={<div className="h-40 rounded-2xl bg-tint/70" aria-busy="true" aria-label="Loading projects" />}>
        <ProjectSections />
      </Suspense>
    </div>
  );
}

async function ProjectSections() {
  const session = await getAppSession();
  const projects = await projectService(getContainer()).list(session);
  const active = projects.filter((project) => !project.archived);
  const archived = projects.filter((project) => project.archived);

  return (
    <>
      <section aria-labelledby="active-projects" className="grid gap-3">
        <h2 id="active-projects" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Active
        </h2>
        {active.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-muted-foreground">
            No active projects. Create one to get started.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {active.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </section>
      {archived.length > 0 && (
        <section aria-labelledby="archived-projects" className="grid gap-3">
          <h2 id="archived-projects" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Archived
          </h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {archived.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <Link href={projectPath(project.id)} className="flex min-w-0 items-center gap-2.5 font-semibold text-ink hover:text-brand">
                  <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full opacity-60", BAR_TONE_CLASSES[project.color])} />
                  <span className="truncate">{project.name}</span>
                </Link>
                <UnarchiveButton projectId={project.id} name={project.name} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={projectPath(project.id)}
      className="block h-full rounded-2xl border border-line bg-surface p-5 shadow-xs transition-shadow hover:shadow-card"
    >
      <span className="flex items-center gap-2.5">
        <span aria-hidden="true" className={cn("size-3 shrink-0 rounded-full", BAR_TONE_CLASSES[project.color])} />
        <span className="truncate font-bold text-ink">{project.name}</span>
      </span>
      {project.description && <span className="mt-1.5 line-clamp-2 block text-sm text-muted-foreground">{project.description}</span>}
    </Link>
  );
}
