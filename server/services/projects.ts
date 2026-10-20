import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import type { ProjectRef } from "@/lib/schemas/dashboard";
import type { createProjectRequestSchema, updateProjectRequestSchema } from "@/lib/schemas/projects";
import type { AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import { workspaceCapacity } from "@/server/domain/capacity";
import type { Project } from "@/server/domain/types";
import { requireOwner } from "./workspace";

/** A project as reports and the timeline label it. */
export const toProjectRef = ({ id, name, color }: Project): ProjectRef => ({ id, name, color });

/** Projects in the signed-in user's workspace. Any member can create and edit; only owners delete. */
export function projectService(container: Container) {
  const requireActiveRoom = (session: AppSession) => workspaceCapacity(container, session.workspace).requireRoomForProject();

  return {
    list(session: AppSession, query: { archived?: boolean } = {}): Promise<Project[]> {
      return container.projects.list({ workspaceId: session.workspace.id, archived: query.archived });
    },

    /** The project, or NOT_FOUND when it doesn't exist or belongs to another workspace. */
    async get(session: AppSession, projectId: string): Promise<Project> {
      const project = await container.projects.findById(projectId);
      if (!project || project.workspaceId !== session.workspace.id) {
        throw new DomainError("NOT_FOUND", "That project doesn't exist or was deleted.");
      }
      return project;
    },

    async create(session: AppSession, input: z.output<typeof createProjectRequestSchema>): Promise<Project> {
      await requireActiveRoom(session);
      return container.projects.create({
        id: `prj_${randomUUID()}`,
        workspaceId: session.workspace.id,
        name: input.name,
        description: input.description,
        color: input.color,
        archived: false,
        createdAt: container.clock.now().toISOString(),
      });
    },

    async update(
      session: AppSession,
      projectId: string,
      patch: z.output<typeof updateProjectRequestSchema>,
    ): Promise<Project> {
      const project = await this.get(session, projectId);
      if (project.archived && patch.archived === false) await requireActiveRoom(session);
      const updated = await container.projects.update(project.id, patch);
      if (!updated) throw new DomainError("NOT_FOUND", "That project doesn't exist or was deleted.");
      return updated;
    },

    /** Owner only. Deletes the project's tasks and their comments too. */
    async delete(session: AppSession, projectId: string): Promise<void> {
      const project = await this.get(session, projectId);
      requireOwner(session, "delete projects");
      const tasks = await container.tasks.list({ projectIds: [project.id] });
      await container.comments.deleteByTasks(tasks.map((task) => task.id));
      await container.tasks.deleteByProject(project.id);
      await container.projects.delete(project.id);
    },
  };
}
