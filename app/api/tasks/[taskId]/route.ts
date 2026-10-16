import { updateTaskRequestSchema, type BoardTask, type TaskDetail } from "@/lib/schemas/tasks";
import { requireSession } from "@/server/auth/session";
import { json, noContent, parseBody, route } from "@/server/http/handler";
import { taskService } from "@/server/services/tasks";

type Params = { taskId: string };

export const GET = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  return json<TaskDetail>(await taskService(container).detail(session, params.taskId));
});

export const PATCH = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  const patch = await parseBody(request, updateTaskRequestSchema);
  return json<BoardTask>(await taskService(container).update(session, params.taskId, patch));
});

export const DELETE = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  await taskService(container).delete(session, params.taskId);
  return noContent();
});
