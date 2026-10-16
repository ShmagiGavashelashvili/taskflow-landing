import { z } from "zod";
import type { Tone } from "@/types";

/**
 * The domain model as it crosses the HTTP API. Shared by route handlers, the typed API client
 * and forms, so request and response shapes can't drift. Server-only fields (password hashes,
 * reset tokens) live in `server/domain` and never appear here.
 *
 * Timestamps are ISO 8601 strings; `dueDate` is a calendar date (`YYYY-MM-DD`).
 */

export const PLAN_IDS = ["free", "pro", "business"] as const;
export const planIdSchema = z.enum(PLAN_IDS);
export type PlanId = z.infer<typeof planIdSchema>;

export const billingPeriodSchema = z.enum(["monthly", "yearly"]);
export type BillingPeriod = z.infer<typeof billingPeriodSchema>;

export const roleSchema = z.enum(["owner", "member"]);
export type Role = z.infer<typeof roleSchema>;

/** Board columns, in display order. */
export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done"] as const;
export const taskStatusSchema = z.enum(TASK_STATUSES);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

/** Lowest to highest. */
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

/** Project colours come from the landing page's tone palette. */
export const PROJECT_COLORS = ["blue", "teal", "amber", "violet", "rose", "slate"] as const satisfies readonly Tone[];
export const projectColorSchema = z.enum(PROJECT_COLORS);

export const invoiceStatusSchema = z.enum(["paid", "open", "void"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

/** Fixed catalogues; per-workspace state is stored against these ids. */
export const INTEGRATION_IDS = ["slack", "github", "gitlab", "google-drive", "figma", "zapier"] as const;
export const integrationIdSchema = z.enum(INTEGRATION_IDS);
export type IntegrationId = z.infer<typeof integrationIdSchema>;

export const AUTOMATION_IDS = [
  "notify-assignee-on-done",
  "assign-creator-on-create",
  "move-to-review-on-comment",
  "flag-overdue-as-urgent",
] as const;
export const automationIdSchema = z.enum(AUTOMATION_IDS);
export type AutomationId = z.infer<typeof automationIdSchema>;

const id = z.string().min(1);
const timestamp = z.iso.datetime();
export const dueDateSchema = z.iso.date();

export const userSchema = z.object({
  id,
  name: z.string(),
  /** Unique, normalised to lowercase. */
  email: z.email(),
  createdAt: timestamp,
});
export type User = z.infer<typeof userSchema>;

export const workspaceSchema = z.object({
  id,
  name: z.string(),
  /** The stored plan. During a trial this is the trial plan; an expired trial reads as Free. */
  plan: planIdSchema,
  billingPeriod: billingPeriodSchema,
  trialEndsAt: timestamp.nullable(),
  createdAt: timestamp,
});
export type Workspace = z.infer<typeof workspaceSchema>;

export const membershipSchema = z.object({
  userId: id,
  workspaceId: id,
  role: roleSchema,
});
export type Membership = z.infer<typeof membershipSchema>;

export const inviteSchema = z.object({
  id,
  workspaceId: id,
  email: z.email(),
  token: z.string(),
  invitedBy: id,
  expiresAt: timestamp,
  acceptedAt: timestamp.nullable(),
  revokedAt: timestamp.nullable(),
});
export type Invite = z.infer<typeof inviteSchema>;

export const projectSchema = z.object({
  id,
  workspaceId: id,
  name: z.string(),
  description: z.string(),
  color: projectColorSchema,
  archived: z.boolean(),
  createdAt: timestamp,
});
export type Project = z.infer<typeof projectSchema>;

export const taskSchema = z.object({
  id,
  projectId: id,
  title: z.string(),
  description: z.string(),
  status: taskStatusSchema,
  /** Ordering within a status column, starting at 0. */
  position: z.number().int().nonnegative(),
  priority: taskPrioritySchema,
  assigneeId: id.nullable(),
  dueDate: dueDateSchema.nullable(),
  createdBy: id,
  createdAt: timestamp,
  updatedAt: timestamp,
  /** Set when the task moves to done, cleared when it leaves. */
  completedAt: timestamp.nullable(),
});
export type Task = z.infer<typeof taskSchema>;

export const commentSchema = z.object({
  id,
  taskId: id,
  authorId: id,
  body: z.string(),
  createdAt: timestamp,
  editedAt: timestamp.nullable(),
});
export type Comment = z.infer<typeof commentSchema>;

export const invoiceSchema = z.object({
  id,
  workspaceId: id,
  /** Total in whole US dollars. */
  amount: z.number().nonnegative(),
  /** Human-readable billing period, e.g. "Sep 2026". */
  period: z.string(),
  status: invoiceStatusSchema,
  issuedAt: timestamp,
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const integrationConnectionSchema = z.object({
  workspaceId: id,
  integrationId: integrationIdSchema,
  connected: z.boolean(),
  updatedAt: timestamp,
});
export type IntegrationConnection = z.infer<typeof integrationConnectionSchema>;

export const automationRuleSchema = z.object({
  workspaceId: id,
  automationId: automationIdSchema,
  enabled: z.boolean(),
  updatedAt: timestamp,
});
export type AutomationRule = z.infer<typeof automationRuleSchema>;
