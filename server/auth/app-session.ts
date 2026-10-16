import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getContainer } from "@/server/container";
import { resolveSession, type AppSession } from "./session";
import { SESSION_COOKIE } from "./token";

/**
 * Session access for Server Components (the data access layer's entry point). Reads the cookie,
 * so call it only inside a `<Suspense>` boundary (Cache Components). Deduped per request.
 *
 * ```tsx
 * async function Greeting() {
 *   const { user, workspace, role } = await getAppSession();
 *   return <h1>Hi {user.name}</h1>;
 * }
 * // in the page: <Suspense fallback={...}><Greeting /></Suspense>
 * ```
 */
export const getOptionalAppSession = cache(async (): Promise<AppSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return resolveSession(getContainer(), token);
});

/**
 * The session, or a redirect to login. A missing session is normally caught earlier by
 * proxy.ts; this catches stale ones (valid JWT, user gone after a store reset) by sending the
 * browser through `GET /api/auth/logout`, which clears the cookie before showing login.
 */
export async function getAppSession(): Promise<AppSession> {
  const session = await getOptionalAppSession();
  if (!session) redirect("/api/auth/logout");
  return session;
}
