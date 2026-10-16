import { z } from "zod";
import { projectColorSchema } from "./entities";

/** Request shapes for `/api/projects/*`. The project form validates with the same schemas. */

const name = z.string().trim().min(1, "Please name the project.").max(60, "Keep it under 60 characters.");
const description = z.string().trim().max(500, "Keep it under 500 characters.");

export const createProjectRequestSchema = z.object({
  name,
  description: description.default(""),
  color: projectColorSchema.default("blue"),
});
export type CreateProjectRequest = z.input<typeof createProjectRequestSchema>;

/** Rename, recolour, archive or unarchive. Unarchiving counts against the active project cap. */
export const updateProjectRequestSchema = z
  .object({ name, description, color: projectColorSchema, archived: z.boolean() })
  .partial();
export type UpdateProjectRequest = z.input<typeof updateProjectRequestSchema>;

/** `GET /api/projects?archived=true|false`; omit for every project. */
export const projectListQuerySchema = z.object({
  archived: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});
