import { changePlanRequestSchema, type ChangePlanResponse } from "@/lib/schemas/billing";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { billingService } from "@/server/services/billing";

/** Owner only. Paid plans go through the mock checkout (`payment` with the test card). */
export const POST = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  const body = await parseBody(request, changePlanRequestSchema);
  return json<ChangePlanResponse>(await billingService(container).changePlan(session, body));
});
