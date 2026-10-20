import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import type { z } from "zod";
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
import { assertUsable, decideAcceptance, invalidInvite, isPending } from "@/server/domain/invites";
import { workspaceCapacity } from "@/server/domain/capacity";
import type { Invite } from "@/server/domain/types";
import { requireOwner } from "@/server/domain/access";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** The path an invitee opens; shown to the owner because the prototype sends no email. */
export const inviteUrl = (token: string) => `/invite/${token}`;

function toPendingInvite(invite: Invite): PendingInvite {
  const { id, email, invitedBy, expiresAt, token } = invite;
  return { id, email, invitedBy, expiresAt, inviteUrl: inviteUrl(token) };
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
      await workspaceCapacity(container, workspace).requireRoomToInvite();

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

      const account = await container.users.findByEmail(invite.email);
      // Only reached for `join` without an account, which `decideAcceptance` allows only when registering.
      const registerAccount = async () => {
        if (input.mode !== "register") throw invalidInvite();
        return container.users.create({
          id: `usr_${randomUUID()}`,
          name: input.name,
          email: invite.email,
          passwordHash: await hashPassword(input.password),
          createdAt: now().toISOString(),
        });
      };
      const decision = decideAcceptance(
        invite,
        input.mode === "register"
          ? { mode: "register", account }
          : {
              mode: "login",
              account: account && { id: account.id, memberships: await container.memberships.listByUser(account.id) },
              passwordOk: account !== null && (await verifyPassword(input.password, account.passwordHash)),
            },
      );

      if (decision.kind === "rejoin") {
        await markUsed();
        return { user: toPublicUser(account!), workspace, role: decision.role };
      }

      await workspaceCapacity(container, workspace).requireRoomToJoin(workspace.name);
      const user = account ?? (await registerAccount());
      const membership = await container.memberships.create({ userId: user.id, workspaceId: workspace.id, role: "member" });
      await markUsed();
      return { user: toPublicUser(user), workspace, role: membership.role };
    },
  };
}
