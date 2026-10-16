import { commentRequestSchema, type CommentView } from "@/lib/schemas/comments";
import { requireSession } from "@/server/auth/session";
import { json, noContent, parseBody, route } from "@/server/http/handler";
import { commentService } from "@/server/services/comments";

type Params = { commentId: string };

export const PATCH = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  const input = await parseBody(request, commentRequestSchema);
  return json<CommentView>(await commentService(container).update(session, params.commentId, input));
});

export const DELETE = route<Params>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  await commentService(container).delete(session, params.commentId);
  return noContent();
});
