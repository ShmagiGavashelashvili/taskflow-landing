import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import {
  boardTaskSchema,
  taskDetailSchema,
  type BoardTask,
  type CreateTaskRequest,
  type MoveTaskRequest,
  type TaskDetail,
  type TaskFilters,
  type UpdateTaskRequest,
} from "@/lib/schemas/tasks";
import { apiRequest } from "./client";

/** `TaskFilters` as the query string `GET /api/projects/:id/tasks` expects (empty values dropped). */
export function taskFilterParams(filters: TaskFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.overdue) params.set("overdue", "true");
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Typed browser calls for tasks. Every single-task response is a `BoardTask` (task + comment count). */
export const tasksApi = {
  list: (projectId: string, filters?: TaskFilters, signal?: AbortSignal) =>
    apiRequest(`/api/projects/${projectId}/tasks${taskFilterParams(filters)}`, { schema: z.array(boardTaskSchema), signal }),
  create: (projectId: string, body: CreateTaskRequest) =>
    apiRequest(`/api/projects/${projectId}/tasks`, { method: "POST", body, schema: boardTaskSchema }),
  /** The detail shape: a board task plus its creator. */
  get: (taskId: string, signal?: AbortSignal) => apiRequest(`/api/tasks/${taskId}`, { schema: taskDetailSchema, signal }),
  update: (taskId: string, body: UpdateTaskRequest) =>
    apiRequest(`/api/tasks/${taskId}`, { method: "PATCH", body, schema: boardTaskSchema }),
  move: (taskId: string, body: MoveTaskRequest) =>
    apiRequest(`/api/tasks/${taskId}/move`, { method: "POST", body, schema: boardTaskSchema }),
  delete: (taskId: string) => apiRequest(`/api/tasks/${taskId}`, { method: "DELETE" }),
};

/**
 * TanStack Query keys and options for tasks, shared by server prefetching (override `queryFn`
 * with a service call) and client hooks. After any task write, invalidate `taskQueries.all()`
 * (or `project(projectId)`) so the board, list, detail and dashboard refetch.
 */
export const taskQueries = {
  all: () => ["tasks"] as const,
  /** Every filtered list of one project. */
  project: (projectId: string) => [...taskQueries.all(), "project", projectId] as const,
  list: (projectId: string, filters: TaskFilters = {}) =>
    queryOptions({
      queryKey: [...taskQueries.project(projectId), normaliseFilters(filters)] as const,
      queryFn: ({ signal }): Promise<BoardTask[]> => tasksApi.list(projectId, filters, signal),
    }),
  detail: (taskId: string) =>
    queryOptions({
      queryKey: [...taskQueries.all(), "detail", taskId] as const,
      queryFn: ({ signal }): Promise<TaskDetail> => tasksApi.get(taskId, signal),
    }),
};

/** Drops empty filters so `{}` and `{ search: "" }` share a cache entry. */
function normaliseFilters(filters: TaskFilters): TaskFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "" && value !== false),
  ) as TaskFilters;
}
