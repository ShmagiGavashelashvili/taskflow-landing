import type { PlanId, Workspace } from "@/lib/schemas/entities";

export type PlanFeature = "timeline" | "reports" | "integrations" | "automations";

export interface PlanLimits {
  /** `null` means unlimited. */
  maxMembers: number | null;
  /** Non-archived projects. `null` means unlimited. */
  maxActiveProjects: number | null;
  features: Record<PlanFeature, boolean>;
}

/** What each plan allows. Matches the pricing copy in `data.ts`. */
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxMembers: 5,
    maxActiveProjects: 3,
    features: { timeline: false, reports: false, integrations: false, automations: false },
  },
  pro: {
    maxMembers: null,
    maxActiveProjects: null,
    features: { timeline: true, reports: true, integrations: true, automations: true },
  },
  business: {
    maxMembers: null,
    maxActiveProjects: null,
    features: { timeline: true, reports: true, integrations: true, automations: true },
  },
};

/** True once a trial has ended. Paid workspaces (`trialEndsAt: null`) never expire. */
export function isTrialExpired(workspace: Pick<Workspace, "trialEndsAt">, now: Date): boolean {
  return workspace.trialEndsAt !== null && new Date(workspace.trialEndsAt).getTime() <= now.getTime();
}

/** The plan whose limits apply right now: an expired trial reads as Free. Nothing is deleted. */
export function effectivePlan(workspace: Pick<Workspace, "plan" | "trialEndsAt">, now: Date): PlanId {
  return isTrialExpired(workspace, now) ? "free" : workspace.plan;
}

export function planLimits(workspace: Pick<Workspace, "plan" | "trialEndsAt">, now: Date): PlanLimits {
  return PLAN_LIMITS[effectivePlan(workspace, now)];
}
