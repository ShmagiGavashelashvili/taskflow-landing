import {
  billingResponseSchema,
  changePlanResponseSchema,
  invoicesResponseSchema,
  type ChangePlanRequest,
} from "@/lib/schemas/billing";
import {
  automationResponseSchema,
  automationsResponseSchema,
  integrationResponseSchema,
  integrationsResponseSchema,
} from "@/lib/schemas/integrations";
import type { AutomationId, IntegrationId } from "@/lib/schemas/entities";
import { apiRequest } from "./client";

/** Typed browser calls for `/api/billing/*` (owner only). */
export const billingApi = {
  get: () => apiRequest("/api/billing", { schema: billingResponseSchema }),
  changePlan: (body: ChangePlanRequest) =>
    apiRequest("/api/billing/plan", { method: "POST", body, schema: changePlanResponseSchema }),
  invoices: () => apiRequest("/api/billing/invoices", { schema: invoicesResponseSchema }),
};

/** Typed browser calls for `/api/integrations/*` and `/api/automations/*`. */
export const integrationsApi = {
  list: () => apiRequest("/api/integrations", { schema: integrationsResponseSchema }),
  set: (id: IntegrationId, connected: boolean) =>
    apiRequest(`/api/integrations/${id}`, { method: "PATCH", body: { connected }, schema: integrationResponseSchema }),
};

export const automationsApi = {
  list: () => apiRequest("/api/automations", { schema: automationsResponseSchema }),
  set: (id: AutomationId, enabled: boolean) =>
    apiRequest(`/api/automations/${id}`, { method: "PATCH", body: { enabled }, schema: automationResponseSchema }),
};
