import { z } from "zod";
import { planIdSchema, roleSchema, userSchema, workspaceSchema } from "./entities";

/**
 * Request and response shapes for `/api/workspace/*` (the signed-in user's workspace, its
 * members and invites) and `/api/invites/*` (the public invite acceptance flow).
 */

const email = z
  .string()
  .trim()
  .min(1, "Please enter an email address.")
  .pipe(z.email("That doesn't look like a valid email address."))
  .transform((value) => value.toLowerCase());

export const workspaceResponseSchema = z.object({ workspace: workspaceSchema });
export type WorkspaceResponse = z.infer<typeof workspaceResponseSchema>;

export const updateWorkspaceRequestSchema = z.object({
  name: z.string().trim().min(1, "Please name your workspace.").max(80, "Keep it under 80 characters."),
});
export type UpdateWorkspaceRequest = z.input<typeof updateWorkspaceRequestSchema>;

export const memberSchema = userSchema.extend({ role: roleSchema });
export type Member = z.infer<typeof memberSchema>;

export const membersResponseSchema = z.object({
  /** In the order they joined; the owner comes first in practice. */
  members: z.array(memberSchema),
  /** The plan whose limits apply now (an expired trial reads as Free). */
  effectivePlan: planIdSchema,
  /** Members plus pending invites allowed by the effective plan; `null` means unlimited. */
  memberLimit: z.number().int().positive().nullable(),
});
export type MembersResponse = z.infer<typeof membersResponseSchema>;

/** A pending invite as the owner sees it. `inviteUrl` is the path to share, since no email is sent. */
export const pendingInviteSchema = z.object({
  id: z.string(),
  email: z.email(),
  invitedBy: z.string(),
  expiresAt: z.iso.datetime(),
  inviteUrl: z.string(),
});
export type PendingInvite = z.infer<typeof pendingInviteSchema>;

export const invitesResponseSchema = z.object({
  /** Pending invites only (not accepted, revoked or expired), newest first. */
  invites: z.array(pendingInviteSchema),
});
export type InvitesResponse = z.infer<typeof invitesResponseSchema>;

export const createInviteRequestSchema = z.object({ email });
export type CreateInviteRequest = z.input<typeof createInviteRequestSchema>;

export const inviteResponseSchema = z.object({ invite: pendingInviteSchema });

/** What the public invite page shows about a valid invite. */
export const invitePreviewSchema = z.object({
  email: z.email(),
  workspaceName: z.string(),
  invitedByName: z.string(),
  expiresAt: z.iso.datetime(),
  /** Whether that email already has an account, so the page offers login instead of register. */
  accountExists: z.boolean(),
});
export type InvitePreview = z.infer<typeof invitePreviewSchema>;

/**
 * Joins the workspace as the invited email: either by creating an account or by logging in to
 * an existing one. The email always comes from the invite.
 */
export const acceptInviteRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("register"),
    name: z.string().trim().min(1, "Please enter your name.").max(80, "Keep it under 80 characters."),
    password: z.string().min(8, "Password must be at least 8 characters.").max(200, "Password is too long."),
  }),
  z.object({
    mode: z.literal("login"),
    password: z.string().min(1, "Please enter your password."),
  }),
]);
export type AcceptInviteRequest = z.input<typeof acceptInviteRequestSchema>;
