import "server-only";
import { planLimits } from "@/lib/plans";
import type { Automation, AutomationsResponse, Integration, IntegrationsResponse } from "@/lib/schemas/integrations";
import { AUTOMATION_IDS, automationIdSchema, INTEGRATION_IDS, integrationIdSchema } from "@/lib/schemas/entities";
import type { AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { AUTOMATIONS, INTEGRATIONS } from "@/server/domain/catalog";
import { DomainError } from "@/server/domain/errors";
import { requireFeature } from "@/server/domain/plan-guards";
import type { Workspace } from "@/server/domain/types";

/**
 * Integration and automation stubs: a fixed catalogue with per-workspace on/off state. Any
 * member can view and toggle; toggling needs a plan with the feature. Nothing is called or run.
 */
export function integrationService(container: Container) {
  async function load(session: AppSession): Promise<Workspace> {
    const workspace = await container.workspaces.findById(session.workspace.id);
    if (!workspace) throw new DomainError("UNAUTHENTICATED", "Please log in to continue.");
    return workspace;
  }

  const available = (workspace: Workspace, feature: "integrations" | "automations") =>
    planLimits(workspace, container.clock.now()).features[feature];

  return {
    async listIntegrations(session: AppSession): Promise<IntegrationsResponse> {
      const workspace = await load(session);
      const state = new Map((await container.integrations.listByWorkspace(workspace.id)).map((c) => [c.integrationId, c.connected]));
      const integrations: Integration[] = INTEGRATION_IDS.map((id) => ({ ...INTEGRATIONS[id], connected: state.get(id) ?? false }));
      return { integrations, available: available(workspace, "integrations") };
    },

    async setIntegration(session: AppSession, rawId: string, connected: boolean): Promise<Integration> {
      const id = integrationIdSchema.safeParse(rawId);
      if (!id.success) throw new DomainError("NOT_FOUND", "That integration doesn't exist.");
      const workspace = await load(session);
      const now = container.clock.now();
      requireFeature(workspace, now, "integrations");
      await container.integrations.upsert({ workspaceId: workspace.id, integrationId: id.data, connected, updatedAt: now.toISOString() });
      return { ...INTEGRATIONS[id.data], connected };
    },

    async listAutomations(session: AppSession): Promise<AutomationsResponse> {
      const workspace = await load(session);
      const state = new Map((await container.automations.listByWorkspace(workspace.id)).map((r) => [r.automationId, r.enabled]));
      const automations: Automation[] = AUTOMATION_IDS.map((id) => ({ ...AUTOMATIONS[id], enabled: state.get(id) ?? false }));
      return { automations, available: available(workspace, "automations") };
    },

    async setAutomation(session: AppSession, rawId: string, enabled: boolean): Promise<Automation> {
      const id = automationIdSchema.safeParse(rawId);
      if (!id.success) throw new DomainError("NOT_FOUND", "That automation doesn't exist.");
      const workspace = await load(session);
      const now = container.clock.now();
      requireFeature(workspace, now, "automations");
      await container.automations.upsert({ workspaceId: workspace.id, automationId: id.data, enabled, updatedAt: now.toISOString() });
      return { ...AUTOMATIONS[id.data], enabled };
    },
  };
}
