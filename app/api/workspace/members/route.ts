import type { MembersResponse } from "@/lib/schemas/workspace";
import { requireSession } from "@/server/auth/session";
import { json, route } from "@/server/http/handler";
import { workspaceService } from "@/server/services/workspace";

/** Visible to every member; managing them is owner only. */
export const GET = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  return json<MembersResponse>(await workspaceService(container).listMembers(session));
});
