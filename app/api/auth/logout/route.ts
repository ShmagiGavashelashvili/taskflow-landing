import { NextResponse } from "next/server";
import { loginUrl, NEXT_PARAM } from "@/lib/auth/paths";
import { endSession } from "@/server/auth/session";
import { route } from "@/server/http/handler";

/** Logs out. Always succeeds. */
export const POST = route(async () => endSession(new NextResponse(null, { status: 204 })));

/**
 * Clears the cookie and redirects to login. Server pages that find a stale session (its user
 * is gone after a store reset) redirect here, because Server Components can't clear cookies
 * and proxy.ts would otherwise bounce the still-valid JWT from /login back into the app.
 */
export const GET = route(async (request) => {
  const next = request.nextUrl.searchParams.get(NEXT_PARAM);
  return endSession(NextResponse.redirect(new URL(loginUrl(next), request.url)));
});
