import { loginRequestSchema, type SessionResponse } from "@/lib/schemas/auth";
import { startSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { authService } from "@/server/services/auth";

export const POST = route(async (request, { container }) => {
  const input = await parseBody(request, loginRequestSchema);
  const session = await authService(container).login(input);
  return startSession(json<SessionResponse>(session), { userId: session.user.id, workspaceId: session.workspace.id });
});
