import { requireSession } from "@/server/auth/session";
import { noContent, route } from "@/server/http/handler";
import { inviteService } from "@/server/services/invites";

/** Owner only: revokes a pending invite, so its link stops working. */
export const DELETE = route<{ inviteId: string }>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  await inviteService(container).revoke(session, params.inviteId);
  return noContent();
});
