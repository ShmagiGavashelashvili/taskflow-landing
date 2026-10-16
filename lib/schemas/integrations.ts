import { z } from "zod";
import { automationIdSchema, integrationIdSchema } from "./entities";

/** Request and response shapes for `/api/integrations/*` and `/api/automations/*`. */

export const integrationSchema = z.object({
  id: integrationIdSchema,
  name: z.string(),
  description: z.string(),
  connected: z.boolean(),
});
export type Integration = z.infer<typeof integrationSchema>;

export const integrationsResponseSchema = z.object({
  integrations: z.array(integrationSchema),
  /** Whether the effective plan includes integrations. When false, toggling is refused. */
  available: z.boolean(),
});
export type IntegrationsResponse = z.infer<typeof integrationsResponseSchema>;

export const toggleIntegrationRequestSchema = z.object({ connected: z.boolean() });
export type ToggleIntegrationRequest = z.input<typeof toggleIntegrationRequestSchema>;
export const integrationResponseSchema = z.object({ integration: integrationSchema });

export const automationSchema = z.object({
  id: automationIdSchema,
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
});
export type Automation = z.infer<typeof automationSchema>;

export const automationsResponseSchema = z.object({
  automations: z.array(automationSchema),
  /** Whether the effective plan includes automations. When false, toggling is refused. */
  available: z.boolean(),
});
export type AutomationsResponse = z.infer<typeof automationsResponseSchema>;

export const toggleAutomationRequestSchema = z.object({ enabled: z.boolean() });
export type ToggleAutomationRequest = z.input<typeof toggleAutomationRequestSchema>;
export const automationResponseSchema = z.object({ automation: automationSchema });
