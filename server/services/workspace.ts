import "server-only";
import type { z } from "zod";
import { effectivePlan, planLimits } from "@/lib/plans";
import type { Member, MembersResponse, updateWorkspaceRequestSchema } from "@/lib/schemas/workspace";
import { toPublicUser, type AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import type { Workspace } from "@/server/domain/types";

/** Throws FORBIDDEN unless the session's user owns the workspace. */
export function requireOwner(session: AppSession, action: string): void {
  if (session.role !== "owner") throw new DomainError("FORBIDDEN", `Only workspace owners can ${action}.`);
}

/** The signed-in user's workspace: details and members. */
export function workspaceService(container: Container) {
  async function load(session: AppSession): Promise<Workspace> {
    const workspace = await container.workspaces.findById(session.workspace.id);
    if (!workspace) throw new DomainError("UNAUTHENTICATED", "Please log in to continue.");
    return workspace;
  }

  return {
    get: load,

    async update(session: AppSession, patch: z.output<typeof updateWorkspaceRequestSchema>): Promise<Workspace> {
      requireOwner(session, "rename the workspace");
      const workspace = await container.workspaces.update(session.workspace.id, { name: patch.name });
      if (!workspace) throw new DomainError("UNAUTHENTICATED", "Please log in to continue.");
      return workspace;
    },

    async listMembers(session: AppSession): Promise<MembersResponse> {
      const workspace = await load(session);
      const memberships = await container.memberships.listByWorkspace(workspace.id);
      const users = new Map((await container.users.findByIds(memberships.map((m) => m.userId))).map((u) => [u.id, u]));
      const members: Member[] = memberships.flatMap((membership) => {
        const user = users.get(membership.userId);
        return user ? [{ ...toPublicUser(user), role: membership.role }] : [];
      });
      const now = container.clock.now();
      return { members, effectivePlan: effectivePlan(workspace, now), memberLimit: planLimits(workspace, now).maxMembers };
    },

    /** Removes a member and unassigns their tasks in this workspace. Their comments stay. */
    async removeMember(session: AppSession, userId: string): Promise<void> {
      requireOwner(session, "remove members");
      const workspaceId = session.workspace.id;
      const membership = await container.memberships.find(userId, workspaceId);
      if (!membership) throw new DomainError("NOT_FOUND", "That person isn't a member of this workspace.");
      if (membership.role === "owner") {
        throw new DomainError("CONFLICT", "Owners can't be removed. The workspace always needs its owner.");
      }
      await container.memberships.delete(userId, workspaceId);

      const projects = await container.projects.list({ workspaceId });
      if (projects.length === 0) return;
      const assigned = await container.tasks.list({ projectIds: projects.map((p) => p.id), assigneeId: userId });
      if (assigned.length > 0) {
        await container.tasks.updateMany(assigned.map((task) => ({ id: task.id, patch: { assigneeId: null } })));
      }
    },
  };
}
