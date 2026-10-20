import { z } from "zod";
import { dueDateSchema, taskPrioritySchema, taskSchema, taskStatusSchema } from "./entities";

/** Request and response shapes for `/api/projects/:id/tasks` and `/api/tasks/*`. */

/** A task as the board, list and detail views get it: the task plus how many comments it has. */
export const boardTaskSchema = taskSchema.extend({ commentCount: z.number().int().nonnegative() });
export type BoardTask = z.infer<typeof boardTaskSchema>;

/** `GET /api/tasks/:id`: a board task plus who created it, for the detail view. */
export const taskDetailSchema = boardTaskSchema.extend({
  creator: z.object({ id: z.string().min(1), name: z.string() }),
});
export type TaskDetail = z.infer<typeof taskDetailSchema>;

/** Sent as `assigneeId` to filter for tasks nobody is assigned to. */
export const UNASSIGNED = "unassigned";

export const taskListQuerySchema = z.object({
  /** A member id, or `"unassigned"`. */
  assigneeId: z
    .string()
    .min(1)
    .transform((value) => (value === UNASSIGNED ? null : value))
    .optional(),
  priority: taskPrioritySchema.optional(),
  /** Open tasks whose due date is before today (UTC). */
  overdue: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  /** Case-insensitive match on the title. */
  search: z.string().trim().max(100).optional(),
});
/** Filters as the client builds them; serialise with `taskFilterParams`. */
export interface TaskFilters {
  assigneeId?: string;
  priority?: z.infer<typeof taskPrioritySchema>;
  overdue?: boolean;
  search?: string;
}

export const TASK_TITLE_MAX = 200;
export const TASK_DESCRIPTION_MAX = 5000;

const title = z
  .string()
  .trim()
  .min(1, "Please give the task a title.")
  .max(TASK_TITLE_MAX, `Keep it under ${TASK_TITLE_MAX} characters.`);
const description = z.string().max(TASK_DESCRIPTION_MAX, `Keep it under ${TASK_DESCRIPTION_MAX} characters.`);
const assigneeId = z.string().min(1).nullable();

export const createTaskRequestSchema = z.object({
  title,
  description: description.default(""),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  assigneeId: assigneeId.default(null),
  dueDate: dueDateSchema.nullable().default(null),
});
export type CreateTaskRequest = z.input<typeof createTaskRequestSchema>;

/** Edits any field. Changing `status` puts the task at the end of its new column; use move to place it. */
export const updateTaskRequestSchema = z
  .object({
    title,
    description,
    status: taskStatusSchema,
    priority: taskPrioritySchema,
    assigneeId,
    dueDate: dueDateSchema.nullable(),
  })
  .partial();
export type UpdateTaskRequest = z.input<typeof updateTaskRequestSchema>;

/** Puts the task at `position` (0 = top) in the `status` column; positions past the end mean last. */
export const moveTaskRequestSchema = z.object({
  status: taskStatusSchema,
  position: z.number().int().nonnegative(),
});
export type MoveTaskRequest = z.infer<typeof moveTaskRequestSchema>;
