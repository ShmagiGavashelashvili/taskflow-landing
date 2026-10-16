import { registerRequestSchema, type SessionResponse } from "@/lib/schemas/auth";
import { startSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { authService } from "@/server/services/auth";

/** Creates a user, their workspace (on a trial of the chosen plan) and logs them in. */
export const POST = route(async (request, { container }) => {
  const input = await parseBody(request, registerRequestSchema);
  const session = await authService(container).register(input);
  return startSession(json<SessionResponse>(session, { status: 201 }), {
    userId: session.user.id,
    workspaceId: session.workspace.id,
  });
});
