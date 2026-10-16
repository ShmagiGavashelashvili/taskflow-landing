import { requireSession } from "@/server/auth/session";
import { noContent, route } from "@/server/http/handler";
import { workspaceService } from "@/server/services/workspace";

/** Owner only. The owner can't remove themselves. */
export const DELETE = route<{ userId: string }>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  await workspaceService(container).removeMember(session, params.userId);
  return noContent();
});
