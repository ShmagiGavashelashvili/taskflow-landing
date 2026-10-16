"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import { taskPath } from "@/lib/app-paths";
import { taskQueries } from "@/lib/api/tasks";
import type { TaskFilters } from "@/lib/schemas/tasks";
import { STATUS_LABELS } from "@/lib/tasks";
import { AssigneeBadge, CommentCount, DueDate, PriorityBadge, TasksLoadError } from "./TaskMeta";
import type { Assignee } from "./types";

interface TaskListProps {
  projectId: string;
  filters: TaskFilters;
  members: readonly Assignee[];
  today: string;
}

/** The dense view: one row per task, in board order. */
export default function TaskList({ projectId, filters, members, today }: TaskListProps) {
  const { data: tasks = [], isError, isPlaceholderData, refetch } = useQuery({ ...taskQueries.list(projectId, filters), placeholderData: keepPreviousData });
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  if (isError && tasks.length === 0 && !isPlaceholderData) return <TasksLoadError onRetry={() => void refetch()} />;

  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-muted-foreground">
        No tasks match these filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-xs">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="border-b border-line text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">Task</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Assignee</th>
            <th scope="col" className="px-4 py-3">Priority</th>
            <th scope="col" className="px-4 py-3">Due</th>
            <th scope="col" className="px-4 py-3"><span className="sr-only">Comments</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-tint/40">
              <td className="max-w-80 px-4 py-2.5">
                <Link href={taskPath(task)} className="block truncate font-semibold text-ink hover:text-brand">
                  {task.title}
                </Link>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{STATUS_LABELS[task.status]}</td>
              <td className="max-w-48 px-4 py-2.5">
                <AssigneeBadge member={task.assigneeId ? membersById.get(task.assigneeId) : undefined} showName />
              </td>
              <td className="px-4 py-2.5"><PriorityBadge priority={task.priority} /></td>
              <td className="px-4 py-2.5 whitespace-nowrap"><DueDate task={task} today={today} /></td>
              <td className="px-4 py-2.5"><CommentCount count={task.commentCount} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
