import { z } from "zod";
import { projectSchema, taskSchema, taskStatusSchema } from "./entities";

/** Response shapes for `/api/dashboard` and `/api/dashboard/reports`. */

/** What a dashboard or timeline needs to label and colour a project. */
export const projectRefSchema = projectSchema.pick({ id: true, name: true, color: true });
export type ProjectRef = z.infer<typeof projectRefSchema>;

export const dashboardStatsSchema = z.object({
  /** Tasks not in done. */
  open: z.number().int().nonnegative(),
  /** Tasks completed since Monday 00:00 UTC. */
  completedThisWeek: z.number().int().nonnegative(),
  /** Open tasks due before today (UTC). */
  overdue: z.number().int().nonnegative(),
  byStatus: z.record(taskStatusSchema, z.number().int().nonnegative()),
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

/** Available on every plan: stats and the signed-in user's open tasks. Covers active projects. */
export const dashboardResponseSchema = z.object({
  stats: dashboardStatsSchema,
  /** Open tasks assigned to the signed-in user, soonest due first (no due date last). */
  myTasks: z.array(taskSchema),
  /** Active projects, oldest first, for labelling tasks. */
  projects: z.array(projectRefSchema),
});
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

/** One row of the workload report. `member: null` is the unassigned row. */
export const workloadRowSchema = z.object({
  member: z.object({ id: z.string(), name: z.string() }).nullable(),
  open: z.number().int().nonnegative(),
  overdue: z.number().int().nonnegative(),
});
export type WorkloadRow = z.infer<typeof workloadRowSchema>;

export const projectProgressSchema = z.object({
  project: projectRefSchema,
  total: z.number().int().nonnegative(),
  done: z.number().int().nonnegative(),
  /** Rounded `done / total` as 0–100; 0 for a project without tasks. */
  percent: z.number().int().min(0).max(100),
});
export type ProjectProgress = z.infer<typeof projectProgressSchema>;

/** Pro and Business only (`PLAN_LIMIT_REACHED` on Free). Covers active projects. */
export const dashboardReportsResponseSchema = z.object({
  /** Every member in join order, then unassigned tasks. */
  workload: z.array(workloadRowSchema),
  /** Active projects, oldest first. */
  projects: z.array(projectProgressSchema),
});
export type DashboardReportsResponse = z.infer<typeof dashboardReportsResponseSchema>;
