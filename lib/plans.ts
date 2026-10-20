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

/** What a workspace currently uses against its limits. */
export interface WorkspaceUsage {
  members: number;
  /** Invites that can still be accepted; each holds a member slot. */
  pendingInvites: number;
  /** Non-archived projects. */
  activeProjects: number;
}

/** Member slots taken: members plus the pending invites that will become members. */
export const memberSlotsUsed = ({ members, pendingInvites }: WorkspaceUsage): number => members + pendingInvites;

/** True when one more of something wouldn't fit under `limit` (`null` = unlimited). */
export const atLimit = (limit: number | null, used: number): boolean => limit !== null && used >= limit;

export const memberLimitMessage = (limit: number | null): string =>
  `Your plan allows up to ${limit} members, including pending invites. Upgrade to Pro for unlimited members.`;

export const projectLimitMessage = (limit: number | null): string =>
  `Your plan includes ${limit} active projects. Archive one or upgrade to Pro for unlimited projects.`;

const FEATURE_NAMES: Record<PlanFeature, string> = {
  timeline: "Timeline",
  reports: "Reports",
  integrations: "Integrations",
  automations: "Automations",
};

export const featureLockedMessage = (feature: PlanFeature): string =>
  `${FEATURE_NAMES[feature]} is available on Pro and Business. Upgrade to unlock them.`;

/** "up to 5 members and 3 active projects, without timeline, reports, …" for a plan's limits. */
export function describeLimits({ maxMembers, maxActiveProjects, features }: PlanLimits): string {
  const caps = [
    maxMembers !== null && `up to ${maxMembers} members`,
    maxActiveProjects !== null && `${maxActiveProjects} active projects`,
  ].filter(Boolean);
  const locked = (Object.keys(FEATURE_NAMES) as PlanFeature[]).filter((feature) => !features[feature]);
  const lockedText = locked.length > 0 ? `, without ${locked.map((f) => f.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " or $1")}` : "";
  return `${caps.join(" and ") || "no caps"}${lockedText}`;
}
