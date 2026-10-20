import "server-only";
import { atLimit, featureLockedMessage, memberSlotsUsed, memberLimitMessage, planLimits, projectLimitMessage, type PlanFeature, type PlanLimits, type WorkspaceUsage } from "@/lib/plans";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import { isPending } from "@/server/domain/invites";
import type { Workspace } from "@/server/domain/types";

export interface WorkspaceCapacity {
  /** The limits of the plan that applies right now. */
  limits: PlanLimits;
  usage(): Promise<WorkspaceUsage>;
  /** Throws `PLAN_LIMIT_REACHED` when the effective plan lacks `feature`. */
  requireFeature(feature: PlanFeature): void;
  /** Throws `PLAN_LIMIT_REACHED` when inviting one more person wouldn't fit (members plus pending invites). */
  requireRoomToInvite(): Promise<void>;
  /** Throws `PLAN_LIMIT_REACHED` when accepting an invite wouldn't fit. The invite already holds its own slot, so only members count. */
  requireRoomToJoin(workspaceName: string): Promise<void>;
  /** Throws `PLAN_LIMIT_REACHED` when one more active project wouldn't fit. */
  requireRoomForProject(): Promise<void>;
}

const limitReached = (message: string) => new DomainError("PLAN_LIMIT_REACHED", message);

/**
 * What a workspace may do on its effective plan, and whether one more member or project fits.
 * Counts come from the repositories, so every rule reads the same numbers.
 */
export function workspaceCapacity(container: Container, workspace: Workspace): WorkspaceCapacity {
  const now = container.clock.now();
  const limits = planLimits(workspace, now);

  async function usage(): Promise<WorkspaceUsage> {
    const [memberships, invites, projects] = await Promise.all([
      container.memberships.listByWorkspace(workspace.id),
      container.invites.listByWorkspace(workspace.id),
      container.projects.list({ workspaceId: workspace.id, archived: false }),
    ]);
    return {
      members: memberships.length,
      pendingInvites: invites.filter((invite) => isPending(invite, now)).length,
      activeProjects: projects.length,
    };
  }

  return {
    limits,
    usage,

    requireFeature(feature) {
      if (!limits.features[feature]) throw limitReached(featureLockedMessage(feature));
    },

    async requireRoomToInvite() {
      if (atLimit(limits.maxMembers, memberSlotsUsed(await usage()))) throw limitReached(memberLimitMessage(limits.maxMembers));
    },

    async requireRoomToJoin(workspaceName) {
      if (atLimit(limits.maxMembers, (await usage()).members)) {
        throw limitReached(`${workspaceName} has reached its plan's limit of ${limits.maxMembers} members. Ask the owner to upgrade.`);
      }
    },

    async requireRoomForProject() {
      if (atLimit(limits.maxActiveProjects, (await usage()).activeProjects)) throw limitReached(projectLimitMessage(limits.maxActiveProjects));
    },
  };
}
