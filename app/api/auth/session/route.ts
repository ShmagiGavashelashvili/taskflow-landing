import type { SessionResponse } from "@/lib/schemas/auth";
import { requireSession } from "@/server/auth/session";
import { json, route } from "@/server/http/handler";

/** The current user, workspace and role; 401 (and a cleared cookie) when logged out or stale. */
export const GET = route(async (request, { container }) => {
  return json<SessionResponse>(await requireSession(request, container));
});
