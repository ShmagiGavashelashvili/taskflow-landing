"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksApi, taskQueries } from "@/lib/api/tasks";
import type { BoardTask, MoveTaskRequest } from "@/lib/schemas/tasks";
import { moveTask } from "@/lib/tasks";

interface MoveVariables {
  task: Pick<BoardTask, "id" | "title" | "projectId">;
  to: MoveTaskRequest;
}

/**
 * Moves a task optimistically: every cached list of its project updates at once, rolls back
 * with a toast if the server refuses, and refetches afterwards so the cache matches the server.
 */
export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ task, to }: MoveVariables) => tasksApi.move(task.id, to),
    onMutate: async ({ task, to }) => {
      const scope = { queryKey: taskQueries.project(task.projectId) };
      await queryClient.cancelQueries(scope);
      const previous = queryClient.getQueriesData<BoardTask[]>(scope);
      const now = new Date();
      queryClient.setQueriesData<BoardTask[]>(scope, (tasks) => tasks && moveTask(tasks, task.id, to, now));
      return { previous };
    },
    onError: (error, { task }, context) => {
      for (const [key, tasks] of context?.previous ?? []) queryClient.setQueryData(key, tasks);
      toast.error(`Couldn't move “${task.title}”. ${error.message}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueries.all() }),
  });
}
