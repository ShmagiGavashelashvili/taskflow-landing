import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { commentViewSchema, type CommentRequest, type CommentView } from "@/lib/schemas/comments";
import { apiRequest } from "./client";
import { taskQueries } from "./tasks";

/** Typed browser calls for task comments. */
export const commentsApi = {
  list: (taskId: string, signal?: AbortSignal) =>
    apiRequest(`/api/tasks/${taskId}/comments`, { schema: z.array(commentViewSchema), signal }),
  create: (taskId: string, body: CommentRequest) =>
    apiRequest(`/api/tasks/${taskId}/comments`, { method: "POST", body, schema: commentViewSchema }),
  update: (commentId: string, body: CommentRequest) =>
    apiRequest(`/api/comments/${commentId}`, { method: "PATCH", body, schema: commentViewSchema }),
  delete: (commentId: string) => apiRequest(`/api/comments/${commentId}`, { method: "DELETE" }),
};

/**
 * A task's comment thread. Keyed under the task's detail key, so invalidating
 * `taskQueries.all()` (after any task write) refreshes it too.
 */
export const commentQueries = {
  thread: (taskId: string) =>
    queryOptions({
      queryKey: [...taskQueries.detail(taskId).queryKey, "comments"] as const,
      queryFn: ({ signal }): Promise<CommentView[]> => commentsApi.list(taskId, signal),
    }),
};
