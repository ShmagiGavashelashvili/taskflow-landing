import { z } from "zod";
import { projectSchema } from "@/lib/schemas/entities";
import type { CreateProjectRequest, UpdateProjectRequest } from "@/lib/schemas/projects";
import { apiRequest } from "./client";

/** Typed browser calls for `/api/projects/*`. */
export const projectsApi = {
  list: (query: { archived?: boolean } = {}) =>
    apiRequest(`/api/projects${query.archived === undefined ? "" : `?archived=${query.archived}`}`, {
      schema: z.array(projectSchema),
    }),
  get: (projectId: string) => apiRequest(`/api/projects/${projectId}`, { schema: projectSchema }),
  create: (body: CreateProjectRequest) => apiRequest("/api/projects", { method: "POST", body, schema: projectSchema }),
  update: (projectId: string, body: UpdateProjectRequest) =>
    apiRequest(`/api/projects/${projectId}`, { method: "PATCH", body, schema: projectSchema }),
  delete: (projectId: string) => apiRequest(`/api/projects/${projectId}`, { method: "DELETE" }),
};
