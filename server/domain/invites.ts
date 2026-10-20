import "server-only";
import { DomainError } from "./errors";
import type { Invite, Membership, Role } from "./types";

/** Not accepted, revoked or expired. Pending invites count toward the member limit. */
export function isPending(invite: Invite, now: Date): boolean {
  return !invite.acceptedAt && !invite.revokedAt && new Date(invite.expiresAt) > now;
}

const ASK_FOR_NEW = "Ask the person who invited you for a new one.";

/** What an unknown or unreadable invite link looks like to the visitor. */
export const invalidInvite = () => new DomainError("INVALID_TOKEN", `This invite link isn't valid. ${ASK_FOR_NEW}`);

/** Throws INVALID_TOKEN with a message saying why the invite can't be used. */
export function assertUsable(invite: Invite | null, now: Date): asserts invite is Invite {
  if (!invite) throw invalidInvite();
  if (invite.acceptedAt) {
    throw new DomainError("INVALID_TOKEN", "This invite has already been used. If it was you, log in instead.");
  }
  if (invite.revokedAt) throw new DomainError("INVALID_TOKEN", `This invite was revoked. ${ASK_FOR_NEW}`);
  if (new Date(invite.expiresAt) <= now) throw new DomainError("INVALID_TOKEN", `This invite has expired. ${ASK_FOR_NEW}`);
}

/** What the visitor is doing on the invite page, and what we know about the invited email. */
export type AcceptAttempt =
  | { mode: "register"; account: { id: string } | null }
  /** `passwordOk` is whether the password they typed matches `account`. */
  | { mode: "login"; account: { id: string; memberships: readonly Pick<Membership, "workspaceId" | "role">[] } | null; passwordOk: boolean };

/** `rejoin`: already a member, so just use the invite up. `join`: add a membership (and an account when registering). */
export type AcceptDecision = { kind: "rejoin"; role: Role } | { kind: "join" };

/**
 * Decides what accepting `invite` does, or throws why it can't. Only the member-limit check is
 * left to the caller, because it needs a count and only applies to `join`.
 */
export function decideAcceptance(invite: Pick<Invite, "email" | "workspaceId">, attempt: AcceptAttempt): AcceptDecision {
  if (attempt.mode === "register") {
    if (attempt.account) {
      throw new DomainError("EMAIL_TAKEN", `An account for ${invite.email} already exists. Log in to accept the invite.`);
    }
    return { kind: "join" };
  }

  const { account, passwordOk } = attempt;
  if (!account) throw new DomainError("INVALID_CREDENTIALS", `There's no account for ${invite.email} yet. Create one instead.`);
  if (!passwordOk) {
    throw new DomainError("INVALID_CREDENTIALS", "That password isn't right.", { password: ["That password isn't right."] });
  }
  const existing = account.memberships.find((m) => m.workspaceId === invite.workspaceId);
  if (existing) return { kind: "rejoin", role: existing.role };
  if (account.memberships.length > 0) {
    throw new DomainError(
      "CONFLICT",
      "This account already belongs to another workspace, and TaskFlow supports one workspace per account for now. Ask for an invite to a different email.",
    );
  }
  return { kind: "join" };
}
