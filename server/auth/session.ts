import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import type { Membership, Role, User, UserRecord, Workspace } from "@/server/domain/types";
import { readSessionToken, SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "./token";

/**
 * Who is making the request. Every route handler and server page that needs auth goes through
 * this module: `requireSession` in handlers, `getAppSession` (server/auth/app-session.ts) in
 * Server Components. Both resolve the cookie against the store, so a session whose user,
 * workspace or membership no longer exists (the mock store reset) counts as logged out.
 */
export interface AppSession {
  user: User;
  workspace: Workspace;
  role: Role;
}

/** Strips server-only fields (the password hash) from a stored user. */
export function toPublicUser(record: UserRecord): User {
  const { id, name, email, createdAt } = record;
  return { id, name, email, createdAt };
}

/** Resolves a raw cookie value to a session, or `null` if it's missing, invalid, expired or stale. */
export async function resolveSession(container: Container, token: string | undefined | null): Promise<AppSession | null> {
  const claims = await readSessionToken(token);
  if (!claims) return null;
  const [user, workspace, membership] = await Promise.all([
    container.users.findById(claims.userId),
    container.workspaces.findById(claims.workspaceId),
    container.memberships.find(claims.userId, claims.workspaceId),
  ]);
  if (!user || !workspace || !membership) return null;
  return { user: toPublicUser(user), workspace, role: membership.role };
}

/** The session for a route handler request, or `null`. */
export function getRequestSession(request: NextRequest, container: Container): Promise<AppSession | null> {
  return resolveSession(container, request.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * The session for a route handler request. Throws UNAUTHENTICATED otherwise; `route()` turns
 * that into a 401 and clears a stale cookie.
 *
 * ```ts
 * export const GET = route(async (request, { container }) => {
 *   const session = await requireSession(request, container);
 *   ...
 * });
 * ```
 */
export async function requireSession(request: NextRequest, container: Container): Promise<AppSession> {
  const session = await getRequestSession(request, container);
  if (!session) throw new DomainError("UNAUTHENTICATED", "Please log in to continue.");
  return session;
}

/** Logs a user into a workspace by setting the session cookie on `response`. */
export async function startSession(response: NextResponse, membership: Pick<Membership, "userId" | "workspaceId">) {
  const token = await signSessionToken({ userId: membership.userId, workspaceId: membership.workspaceId });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export function endSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
