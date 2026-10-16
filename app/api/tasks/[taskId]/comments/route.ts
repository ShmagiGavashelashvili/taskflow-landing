import { commentRequestSchema, type CommentView } from "@/lib/schemas/comments";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { commentService } from "@/server/services/comments";

type Params = { taskId: string };

export const GET = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  return json<CommentView[]>(await commentService(container).list(session, params.taskId));
});

export const POST = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  const input = await parseBody(request, commentRequestSchema);
  return json<CommentView>(await commentService(container).create(session, params.taskId, input), { status: 201 });
});
