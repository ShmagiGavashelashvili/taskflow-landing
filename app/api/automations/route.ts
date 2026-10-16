import type { AutomationsResponse } from "@/lib/schemas/integrations";
import { requireSession } from "@/server/auth/session";
import { json, route } from "@/server/http/handler";
import { integrationService } from "@/server/services/integrations";

/** Any member. `available` says whether the plan allows toggling. */
export const GET = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  return json<AutomationsResponse>(await integrationService(container).listAutomations(session));
});
