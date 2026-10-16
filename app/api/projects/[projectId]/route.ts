import type { Project } from "@/lib/schemas/entities";
import { updateProjectRequestSchema } from "@/lib/schemas/projects";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { projectService } from "@/server/services/projects";

type Params = { projectId: string };

export const GET = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  return json<Project>(await projectService(container).get(session, params.projectId));
});

export const PATCH = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  const patch = await parseBody(request, updateProjectRequestSchema);
  return json<Project>(await projectService(container).update(session, params.projectId, patch));
});

export const DELETE = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  await projectService(container).delete(session, params.projectId);
  return new Response(null, { status: 204 });
});
