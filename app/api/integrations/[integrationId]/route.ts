import { toggleIntegrationRequestSchema, type Integration } from "@/lib/schemas/integrations";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { integrationService } from "@/server/services/integrations";

/** Any member, on a plan with integrations. Only records state; nothing is connected. */
export const PATCH = route<{ integrationId: string }>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  const { connected } = await parseBody(request, toggleIntegrationRequestSchema);
  const integration = await integrationService(container).setIntegration(session, params.integrationId, connected);
  return json<{ integration: Integration }>({ integration });
});
