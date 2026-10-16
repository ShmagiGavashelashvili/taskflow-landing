import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { sessionSecret } from "@/server/config";

/**
 * The session cookie: a stateless HS256 JWT holding the user and workspace ids. Pure (no store
 * access), so route handlers, Server Components and `proxy.ts` all share it.
 */

export const SESSION_COOKIE = "tf_session";

/** 30 days, in seconds. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export interface SessionClaims {
  userId: string;
  workspaceId: string;
}

const key = () => new TextEncoder().encode(sessionSecret());

export async function signSessionToken({ userId, workspaceId }: SessionClaims): Promise<string> {
  return new SignJWT({ wid: workspaceId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

/** The claims of a valid, unexpired token, or `null` for anything else. Never throws. */
export async function readSessionToken(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.wid !== "string") return null;
    return { userId: payload.sub, workspaceId: payload.wid };
  } catch {
    return null;
  }
}

/** Options for setting the session cookie on a response. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
