"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BAR_TONE_CLASSES } from "@/constants/tones";
import { projectPath } from "@/lib/app-paths";
import type { Project } from "@/lib/schemas/entities";
import { cn } from "@/lib/utils";

type SidebarProject = Pick<Project, "id" | "name" | "color">;

/**
 * The sidebar's project links, highlighting the open project. `usePathname` suspends under
 * dynamic segments, so render inside `<Suspense fallback={<StaticSidebarProjectLinks ... />}>`.
 */
export function SidebarProjectLinks({ projects }: { projects: SidebarProject[] }) {
  const pathname = usePathname();
  return <ProjectList projects={projects} isActive={(href) => pathname === href || pathname.startsWith(`${href}/`)} />;
}

export function StaticSidebarProjectLinks({ projects }: { projects: SidebarProject[] }) {
  return <ProjectList projects={projects} isActive={() => false} />;
}

function ProjectList({ projects, isActive }: { projects: SidebarProject[]; isActive: (href: string) => boolean }) {
  return (
    <ul className="grid gap-0.5">
      {projects.map((project) => {
        const href = projectPath(project.id);
        const active = isActive(href);
        return (
          <li key={project.id}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active ? "bg-tint text-brand" : "text-muted-foreground hover:bg-tint/60 hover:text-ink",
              )}
            >
              <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", BAR_TONE_CLASSES[project.color])} />
              <span className="truncate">{project.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
