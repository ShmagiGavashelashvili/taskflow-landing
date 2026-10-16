import { createTaskRequestSchema, taskListQuerySchema, type BoardTask } from "@/lib/schemas/tasks";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, parseQuery, route } from "@/server/http/handler";
import { taskService } from "@/server/services/tasks";

type Params = { projectId: string };

export const GET = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  const filters = parseQuery(request, taskListQuerySchema);
  return json<BoardTask[]>(await taskService(container).list(session, params.projectId, filters));
});

export const POST = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  const input = await parseBody(request, createTaskRequestSchema);
  return json<BoardTask>(await taskService(container).create(session, params.projectId, input), { status: 201 });
});
