import { updateWorkspaceRequestSchema, type WorkspaceResponse } from "@/lib/schemas/workspace";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { workspaceService } from "@/server/services/workspace";

export const GET = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  return json<WorkspaceResponse>({ workspace: await workspaceService(container).get(session) });
});

/** Owner only. */
export const PATCH = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  const patch = await parseBody(request, updateWorkspaceRequestSchema);
  return json<WorkspaceResponse>({ workspace: await workspaceService(container).update(session, patch) });
});
