import "server-only";
import { planLimits, type PlanFeature } from "@/lib/plans";
import type { Workspace } from "@/lib/schemas/entities";
import { DomainError } from "@/server/domain/errors";

const FEATURE_NAMES: Record<PlanFeature, string> = {
  timeline: "Timeline",
  reports: "Reports",
  integrations: "Integrations",
  automations: "Automations",
};

/** Throws `PLAN_LIMIT_REACHED` when the workspace's effective plan lacks `feature`. */
export function requireFeature(workspace: Workspace, now: Date, feature: PlanFeature): void {
  if (!planLimits(workspace, now).features[feature]) {
    throw new DomainError("PLAN_LIMIT_REACHED", `${FEATURE_NAMES[feature]} is available on Pro and Business. Upgrade to unlock them.`);
  }
}

/** Throws `PLAN_LIMIT_REACHED` when adding one more would exceed `limit` (`null` = unlimited). */
export function requireRoom(limit: number | null, current: number, message: string): void {
  if (limit !== null && current >= limit) throw new DomainError("PLAN_LIMIT_REACHED", message);
}
