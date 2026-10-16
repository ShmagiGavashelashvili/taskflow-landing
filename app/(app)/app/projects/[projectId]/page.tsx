import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { taskQueries } from "@/lib/api/tasks";
import { isoDate } from "@/lib/tasks";
import { getAppSession } from "@/server/auth/app-session";
import { getContainer } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import { projectService } from "@/server/services/projects";
import { taskService } from "@/server/services/tasks";
import ProjectView from "./ProjectView";

export const metadata: Metadata = { title: "Project · TaskFlow" };

/**
 * A project's board and list. The first load reads through the services on the server and
 * seeds the TanStack Query cache under the same key the client uses, so there's no refetch.
 */
export default function ProjectPage({ params }: PageProps<"/app/projects/[projectId]">) {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectData params={params} />
    </Suspense>
  );
}

async function ProjectData({ params }: Pick<PageProps<"/app/projects/[projectId]">, "params">) {
  const { projectId } = await params;
  const session = await getAppSession();
  const container = getContainer();

  const project = await projectService(container)
    .get(session, projectId)
    .catch((error: unknown) => {
      if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
      throw error;
    });
  const tasks = taskService(container);
  const [taskList, members] = await Promise.all([tasks.list(session, project.id), tasks.assignees(session)]);

  const queryClient = new QueryClient();
  queryClient.setQueryData(taskQueries.list(project.id).queryKey, taskList);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectView
        // Remount per project so filters and view reset when switching projects.
        key={project.id}
        project={project}
        members={members}
        canDelete={session.role === "owner"}
        today={isoDate(container.clock.now())}
      />
    </HydrationBoundary>
  );
}

function ProjectSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading project">
      <div className="h-8 w-64 rounded-lg bg-tint" />
      <div className="h-9 w-full max-w-xl rounded-lg bg-tint/70" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((column) => (
          <div key={column} className="h-80 rounded-2xl bg-tint/50" />
        ))}
      </div>
    </div>
  );
}
