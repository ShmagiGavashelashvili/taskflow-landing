import type { SessionResponse } from "@/lib/schemas/auth";
import { acceptInviteRequestSchema } from "@/lib/schemas/workspace";
import { startSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { inviteService } from "@/server/services/invites";

/** Public: joins the workspace (register or log in as the invited email) and logs into it. */
export const POST = route<{ token: string }>(async (request, { params, container }) => {
  const input = await parseBody(request, acceptInviteRequestSchema);
  const session = await inviteService(container).accept(params.token, input);
  return startSession(json<SessionResponse>(session), { userId: session.user.id, workspaceId: session.workspace.id });
});
