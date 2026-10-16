import "server-only";
import type { Invite } from "./types";

/** Not accepted, revoked or expired. Pending invites count toward the member limit. */
export function isPending(invite: Invite, now: Date): boolean {
  return !invite.acceptedAt && !invite.revokedAt && new Date(invite.expiresAt) > now;
}
