import { toggleAutomationRequestSchema, type Automation } from "@/lib/schemas/integrations";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { integrationService } from "@/server/services/integrations";

/** Any member, on a plan with automations. Only records state; nothing runs. */
export const PATCH = route<{ automationId: string }>(async (request, { params, container }) => {
  const session = await requireSession(request, container);
  const { enabled } = await parseBody(request, toggleAutomationRequestSchema);
  const automation = await integrationService(container).setAutomation(session, params.automationId, enabled);
  return json<{ automation: Automation }>({ automation });
});
