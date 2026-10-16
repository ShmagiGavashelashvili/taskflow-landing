import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import type { z } from "zod";
import { planLimits } from "@/lib/plans";
import type {
  acceptInviteRequestSchema,
  createInviteRequestSchema,
  InvitePreview,
  PendingInvite,
} from "@/lib/schemas/workspace";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { toPublicUser, type AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import { isPending } from "@/server/domain/invites";
import { requireRoom } from "@/server/domain/plan-guards";
import type { Invite } from "@/server/domain/types";
import { requireOwner } from "./workspace";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** The path an invitee opens; shown to the owner because the prototype sends no email. */
export const inviteUrl = (token: string) => `/invite/${token}`;

function toPendingInvite(invite: Invite): PendingInvite {
  const { id, email, invitedBy, expiresAt, token } = invite;
  return { id, email, invitedBy, expiresAt, inviteUrl: inviteUrl(token) };
}

/** The member-limit message for a workspace whose effective plan caps members. */
function memberLimitMessage(limit: number | null): string {
  return `Your plan allows up to ${limit} members, including pending invites. Upgrade to Pro for unlimited members.`;
}

const ASK_FOR_NEW = "Ask the person who invited you for a new one.";
const invalidInvite = () => new DomainError("INVALID_TOKEN", `This invite link isn't valid. ${ASK_FOR_NEW}`);

/** Throws INVALID_TOKEN with a message saying why the invite can't be used. */
function assertUsable(invite: Invite | null, now: Date): asserts invite is Invite {
  if (!invite) throw invalidInvite();
  if (invite.acceptedAt) {
    throw new DomainError("INVALID_TOKEN", "This invite has already been used. If it was you, log in instead.");
  }
  if (invite.revokedAt) throw new DomainError("INVALID_TOKEN", `This invite was revoked. ${ASK_FOR_NEW}`);
  if (new Date(invite.expiresAt) <= now) throw new DomainError("INVALID_TOKEN", `This invite has expired. ${ASK_FOR_NEW}`);
}

/** Invite management for the signed-in owner's workspace, plus the public preview and accept steps. */
export function inviteService(container: Container) {
  const now = () => container.clock.now();

  async function pending(workspaceId: string): Promise<Invite[]> {
    const at = now();
    return (await container.invites.listByWorkspace(workspaceId)).filter((invite) => isPending(invite, at));
  }

  return {
    async list(session: AppSession): Promise<PendingInvite[]> {
      requireOwner(session, "see invites");
      return (await pending(session.workspace.id)).map(toPendingInvite);
    },

    async create(session: AppSession, { email }: z.output<typeof createInviteRequestSchema>): Promise<PendingInvite> {
      requireOwner(session, "invite people");
      const { workspace } = session;

      const existingUser = await container.users.findByEmail(email);
      if (existingUser && (await container.memberships.find(existingUser.id, workspace.id))) {
        throw new DomainError("CONFLICT", "That person is already a member of this workspace.", {
          email: ["This person is already a member."],
        });
      }
      const pendingInvites = await pending(workspace.id);
      if (pendingInvites.some((invite) => invite.email === email)) {
        throw new DomainError("CONFLICT", "That email already has a pending invite.", {
          email: ["This email is already invited. Copy the link from Pending invites below."],
        });
      }
      const members = await container.memberships.listByWorkspace(workspace.id);
      const { maxMembers } = planLimits(workspace, now());
      requireRoom(maxMembers, members.length + pendingInvites.length, memberLimitMessage(maxMembers));

      const invite = await container.invites.create({
        id: `inv_${randomUUID()}`,
        workspaceId: workspace.id,
        email,
        token: randomBytes(32).toString("base64url"),
        invitedBy: session.user.id,
        expiresAt: new Date(now().getTime() + INVITE_TTL_MS).toISOString(),
        acceptedAt: null,
        revokedAt: null,
      });
      return toPendingInvite(invite);
    },

    async revoke(session: AppSession, inviteId: string): Promise<void> {
      requireOwner(session, "revoke invites");
      const invite = await container.invites.findById(inviteId);
      if (!invite || invite.workspaceId !== session.workspace.id || !isPending(invite, now())) {
        throw new DomainError("NOT_FOUND", "That invite doesn't exist or is no longer pending.");
      }
      await container.invites.update(invite.id, { revokedAt: now().toISOString() });
    },

    /** Public: what the invite page shows. Throws INVALID_TOKEN for unusable invites. */
    async preview(token: string): Promise<InvitePreview> {
      const invite = await container.invites.findByToken(token);
      assertUsable(invite, now());
      const [workspace, inviter, account] = await Promise.all([
        container.workspaces.findById(invite.workspaceId),
        container.users.findById(invite.invitedBy),
        container.users.findByEmail(invite.email),
      ]);
      if (!workspace) throw invalidInvite();
      return {
        email: invite.email,
        workspaceName: workspace.name,
        invitedByName: inviter?.name ?? "A teammate",
        expiresAt: invite.expiresAt,
        accountExists: account !== null,
      };
    },

    /**
     * Public: joins the invite's workspace as a member, by registering the invited email or
     * logging in to its account. Single use. Returns the session to start.
     */
    async accept(token: string, input: z.output<typeof acceptInviteRequestSchema>): Promise<AppSession> {
      const invite = await container.invites.findByToken(token);
      assertUsable(invite, now());
      const workspace = await container.workspaces.findById(invite.workspaceId);
      if (!workspace) throw invalidInvite();
      const markUsed = () => container.invites.update(invite.id, { acceptedAt: now().toISOString() });

      let user = await container.users.findByEmail(invite.email);
      if (input.mode === "register" && user) {
        throw new DomainError("EMAIL_TAKEN", `An account for ${invite.email} already exists. Log in to accept the invite.`);
      }
      if (input.mode === "login") {
        if (!user) throw new DomainError("INVALID_CREDENTIALS", `There's no account for ${invite.email} yet. Create one instead.`);
        if (!(await verifyPassword(input.password, user.passwordHash))) {
          throw new DomainError("INVALID_CREDENTIALS", "That password isn't right.", { password: ["That password isn't right."] });
        }
        const memberships = await container.memberships.listByUser(user.id);
        const existing = memberships.find((m) => m.workspaceId === workspace.id);
        if (existing) {
          await markUsed();
          return { user: toPublicUser(user), workspace, role: existing.role };
        }
        if (memberships.length > 0) {
          throw new DomainError(
            "CONFLICT",
            "This account already belongs to another workspace, and TaskFlow supports one workspace per account for now. Ask for an invite to a different email.",
          );
        }
      }

      const members = await container.memberships.listByWorkspace(workspace.id);
      const { maxMembers } = planLimits(workspace, now());
      requireRoom(maxMembers, members.length, `${workspace.name} has reached its plan's limit of ${maxMembers} members. Ask the owner to upgrade.`);

      if (!user) {
        if (input.mode !== "register") throw invalidInvite(); // unreachable: login without an account threw above
        user = await container.users.create({
          id: `usr_${randomUUID()}`,
          name: input.name,
          email: invite.email,
          passwordHash: await hashPassword(input.password),
          createdAt: now().toISOString(),
        });
      }
      const membership = await container.memberships.create({ userId: user.id, workspaceId: workspace.id, role: "member" });
      await markUsed();
      return { user: toPublicUser(user), workspace, role: membership.role };
    },
  };
}
