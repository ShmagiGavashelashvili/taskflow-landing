"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksApi, taskQueries } from "@/lib/api/tasks";
import type { UpdateTaskRequest } from "@/lib/schemas/tasks";

/**
 * Edits a task from its detail view, optimistically: the detail updates at once, rolls back
 * with a toast if the server refuses, and every task query (board, list, detail, dashboard)
 * refetches afterwards. A status change lands at the end of the new column, as on the server.
 */
export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = taskQueries.detail(taskId);

  return useMutation({
    mutationFn: (patch: UpdateTaskRequest) => tasksApi.update(taskId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (task) =>
        task && { ...task, ...patch, updatedAt: new Date().toISOString() },
      );
      return { previous };
    },
    // The PATCH response has no creator; keep the one we have.
    onSuccess: (saved) => queryClient.setQueryData(queryKey, (task) => task && { ...task, ...saved }),
    onError: (error, _patch, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error(`Couldn't save the task. ${error.message}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueries.all() }),
  });
}
