import type { Project } from "@/lib/schemas/entities";
import { createProjectRequestSchema, projectListQuerySchema } from "@/lib/schemas/projects";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, parseQuery, route } from "@/server/http/handler";
import { projectService } from "@/server/services/projects";

export const GET = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  const query = parseQuery(request, projectListQuerySchema);
  return json<Project[]>(await projectService(container).list(session, query));
});

export const POST = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  const input = await parseBody(request, createProjectRequestSchema);
  return json<Project>(await projectService(container).create(session, input), { status: 201 });
});
