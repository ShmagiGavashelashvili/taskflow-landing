import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { taskPath } from "@/lib/app-paths";
import { commentQueries } from "@/lib/api/comments";
import { taskQueries } from "@/lib/api/tasks";
import { isoDate } from "@/lib/tasks";
import { getAppSession } from "@/server/auth/app-session";
import { getContainer } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import { commentService } from "@/server/services/comments";
import { projectService } from "@/server/services/projects";
import { taskService } from "@/server/services/tasks";
import TaskDetailView from "./TaskDetailView";
import { pageTitle } from "@/lib/page-title";

export const metadata: Metadata = { title: pageTitle("Task") };

type Props = PageProps<"/app/projects/[projectId]/tasks/[taskId]">;

/**
 * The shareable task page (board cards and list rows link here). The task and its comments
 * are read through the services and seeded into the TanStack Query cache under the client's keys.
 */
export default function TaskPage({ params }: Props) {
  return (
    <Suspense fallback={<TaskSkeleton />}>
      <TaskData params={params} />
    </Suspense>
  );
}

async function TaskData({ params }: Pick<Props, "params">) {
  const { projectId, taskId } = await params;
  const session = await getAppSession();
  const container = getContainer();
  const tasks = taskService(container);

  const task = await tasks.detail(session, taskId).catch((error: unknown) => {
    if (error instanceof DomainError && error.code === "NOT_FOUND") notFound();
    throw error;
  });
  // An old link after the URL's project changed: send it to the right one.
  if (task.projectId !== projectId) redirect(taskPath(task));

  const [project, comments, members] = await Promise.all([
    projectService(container).get(session, task.projectId),
    commentService(container).list(session, task.id),
    tasks.assignees(session),
  ]);

  const queryClient = new QueryClient();
  queryClient.setQueryData(taskQueries.detail(task.id).queryKey, task);
  queryClient.setQueryData(commentQueries.thread(task.id).queryKey, comments);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TaskDetailView
        key={task.id}
        taskId={task.id}
        project={{ id: project.id, name: project.name }}
        members={members}
        currentUser={{ id: session.user.id, name: session.user.name }}
        today={isoDate(container.clock.now())}
      />
    </HydrationBoundary>
  );
}

function TaskSkeleton() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6" aria-busy="true" aria-label="Loading task">
      <div className="h-5 w-40 rounded bg-tint" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid content-start gap-4">
          <div className="h-9 w-3/4 rounded-lg bg-tint" />
          <div className="h-32 rounded-xl bg-tint/70" />
          <div className="h-24 rounded-xl bg-tint/50" />
        </div>
        <div className="h-80 rounded-2xl bg-tint/50" />
      </div>
    </div>
  );
}
