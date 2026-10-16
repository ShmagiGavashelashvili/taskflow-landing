import { NextResponse, type NextRequest } from "next/server";
import { APP_HOME, APP_PATH_HEADER, loginUrl, NEXT_PARAM, safeNextPath } from "@/lib/auth/paths";
import { readSessionToken, SESSION_COOKIE } from "@/server/auth/token";

/** Auth pages that make no sense once logged in. Forgot and reset password stay reachable. */
const GUEST_ONLY = new Set(["/login", "/register"]);

/**
 * Optimistic redirects from the JWT alone (proxy can't see the store): logged-out visitors of
 * `/app/*` go to login with a return URL, and logged-in visitors of login/register go to the
 * app. Not a security boundary: route handlers and server pages check the session again.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const loggedIn = (await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value)) !== null;

  const appPage = pathname === APP_HOME || pathname.startsWith(`${APP_HOME}/`);
  if (!loggedIn && appPage) {
    return NextResponse.redirect(new URL(loginUrl(pathname + search), request.url));
  }
  if (appPage) {
    // Server pages can't see the URL; getAppSession() reads this to keep the return path when
    // it finds a stale session. Always overwritten, so a client can't supply its own.
    const headers = new Headers(request.headers);
    headers.set(APP_PATH_HEADER, pathname + search);
    return NextResponse.next({ request: { headers } });
  }
  if (loggedIn && GUEST_ONLY.has(pathname)) {
    const next = safeNextPath(searchParams.get(NEXT_PARAM)) ?? APP_HOME;
    return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app", "/app/:path*", "/login", "/register", "/forgot-password", "/reset-password"],
};
