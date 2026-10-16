import { moveTaskRequestSchema, type BoardTask } from "@/lib/schemas/tasks";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { taskService } from "@/server/services/tasks";

export const POST = route<{ taskId: string }>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  const to = await parseBody(request, moveTaskRequestSchema);
  return json<BoardTask>(await taskService(container).move(session, params.taskId, to));
});
