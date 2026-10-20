import "server-only";
import { isOwner } from "@/lib/access";
import type { AppSession } from "@/server/auth/session";
import { DomainError } from "./errors";

/** Throws FORBIDDEN unless the session's user owns the workspace. */
export function requireOwner(session: AppSession, action: string): void {
  if (!isOwner(session.role)) throw new DomainError("FORBIDDEN", `Only workspace owners can ${action}.`);
}
