import { z } from "zod";
import { dueDateSchema, taskSchema } from "./entities";
import { projectRefSchema } from "./dashboard";

/** Request and response shapes for `GET /api/timeline`. Pro and Business only. */

/** The longest range one request may cover (inclusive days). */
export const MAX_TIMELINE_DAYS = 92;

export const timelineQuerySchema = z.object({
  /** Inclusive `YYYY-MM-DD`. Defaults to this week's Monday (UTC). */
  from: dueDateSchema.optional(),
  /** Inclusive `YYYY-MM-DD`. Defaults to six days after `from`. */
  to: dueDateSchema.optional(),
  /** Only this project's tasks. */
  projectId: z.string().min(1).optional(),
});
export type TimelineQuery = z.infer<typeof timelineQuerySchema>;

export const timelineResponseSchema = z.object({
  from: dueDateSchema,
  to: dueDateSchema,
  /** The timeline's rows: active projects oldest first, or just the filtered project. */
  projects: z.array(projectRefSchema),
  /** Tasks due in the range (done ones included), by due date, then project, then board order. */
  tasks: z.array(taskSchema),
});
export type TimelineResponse = z.infer<typeof timelineResponseSchema>;
