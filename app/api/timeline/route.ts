import { timelineQuerySchema, type TimelineResponse } from "@/lib/schemas/timeline";
import { requireSession } from "@/server/auth/session";
import { json, parseQuery, route } from "@/server/http/handler";
import { timelineService } from "@/server/services/timeline";

export const GET = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  const query = parseQuery(request, timelineQuerySchema);
  return json<TimelineResponse>(await timelineService(container).list(session, query));
});
