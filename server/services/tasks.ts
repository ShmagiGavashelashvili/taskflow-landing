import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import type { createTaskRequestSchema, MoveTaskRequest, taskListQuerySchema, updateTaskRequestSchema, BoardTask } from "@/lib/schemas/tasks";
import { isoDate, moveTask } from "@/lib/tasks";
import type { AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import type { Project, Task, User } from "@/server/domain/types";
import { projectService } from "./projects";

const DAY_MS = 24 * 60 * 60 * 1000;

type TaskFilters = z.output<typeof taskListQuerySchema>;

/** Tasks in the signed-in user's workspace. Any member can create, edit, move and delete them. */
export function taskService(container: Container) {
  const projects = projectService(container);

  async function withCommentCounts(tasks: Task[]): Promise<BoardTask[]> {
    const counts = await container.comments.countByTasks(tasks.map((task) => task.id));
    return tasks.map((task) => ({ ...task, commentCount: counts[task.id] ?? 0 }));
  }

  async function withCommentCount(task: Task): Promise<BoardTask> {
    return (await withCommentCounts([task]))[0];
  }

  /** The task and its project, or NOT_FOUND when either is outside the session's workspace. */
  async function load(session: AppSession, taskId: string): Promise<{ task: Task; project: Project }> {
    const task = await container.tasks.findById(taskId);
    const project = task && (await container.projects.findById(task.projectId));
    if (!task || !project || project.workspaceId !== session.workspace.id) {
      throw new DomainError("NOT_FOUND", "That task doesn't exist or was deleted.");
    }
    return { task, project };
  }

  async function requireAssignable(session: AppSession, assigneeId: string | null | undefined) {
    if (!assigneeId) return;
    if (!(await container.memberships.find(assigneeId, session.workspace.id))) {
      throw new DomainError("VALIDATION_ERROR", "Please check the highlighted fields.", {
        assigneeId: ["Only workspace members can be assigned."],
      });
    }
  }

  /** Applies a move to the whole project and saves every task whose place changed. */
  async function applyMove(task: Task, to: MoveTaskRequest, now: Date): Promise<Task> {
    const siblings = await container.tasks.list({ projectIds: [task.projectId] });
    const before = new Map(siblings.map((t) => [t.id, t]));
    const patches = moveTask(siblings, task.id, to, now).flatMap((t) => {
      const old = before.get(t.id)!;
      if (t.id === task.id) return [{ id: t.id, patch: { status: t.status, position: t.position, completedAt: t.completedAt } }];
      return old.position === t.position ? [] : [{ id: t.id, patch: { position: t.position } }];
    });
    await container.tasks.updateMany(patches);
    return (await container.tasks.findById(task.id))!;
  }

  return {
    /** Everyone a task can be assigned to (workspace members, in join order): id and name only. */
    async assignees(session: AppSession): Promise<Array<Pick<User, "id" | "name">>> {
      const memberships = await container.memberships.listByWorkspace(session.workspace.id);
      const users = new Map((await container.users.findByIds(memberships.map((m) => m.userId))).map((u) => [u.id, u]));
      return memberships.flatMap(({ userId }) => {
        const user = users.get(userId);
        return user ? [{ id: user.id, name: user.name }] : [];
      });
    },

    async list(session: AppSession, projectId: string, filters: TaskFilters = {}): Promise<BoardTask[]> {
      const project = await projects.get(session, projectId);
      const now = container.clock.now();
      const tasks = await container.tasks.list({
        projectIds: [project.id],
        assigneeId: filters.assigneeId,
        priority: filters.priority,
        search: filters.search || undefined,
        ...(filters.overdue && { dueTo: isoDate(new Date(now.getTime() - DAY_MS)), excludeDone: true }),
      });
      return withCommentCounts(tasks);
    },

    async get(session: AppSession, taskId: string): Promise<BoardTask> {
      return withCommentCount((await load(session, taskId)).task);
    },

    async create(session: AppSession, projectId: string, input: z.output<typeof createTaskRequestSchema>): Promise<BoardTask> {
      const project = await projects.get(session, projectId);
      await requireAssignable(session, input.assigneeId);
      const column = await container.tasks.list({ projectIds: [project.id], status: input.status });
      const now = container.clock.now().toISOString();
      const task = await container.tasks.create({
        id: `tsk_${randomUUID()}`,
        projectId: project.id,
        ...input,
        position: column.length,
        createdBy: session.user.id,
        createdAt: now,
        updatedAt: now,
        completedAt: input.status === "done" ? now : null,
      });
      return { ...task, commentCount: 0 };
    },

    async update(session: AppSession, taskId: string, patch: z.output<typeof updateTaskRequestSchema>): Promise<BoardTask> {
      const { task } = await load(session, taskId);
      await requireAssignable(session, patch.assigneeId);
      const now = container.clock.now();
      const { status, ...fields } = patch;
      if (status !== undefined && status !== task.status) {
        await applyMove(task, { status, position: Number.MAX_SAFE_INTEGER }, now);
      }
      const updated = await container.tasks.update(task.id, { ...fields, updatedAt: now.toISOString() });
      if (!updated) throw new DomainError("NOT_FOUND", "That task doesn't exist or was deleted.");
      return withCommentCount(updated);
    },

    /** Places the task in a column at a position, renumbering its old and new columns. */
    async move(session: AppSession, taskId: string, to: MoveTaskRequest): Promise<BoardTask> {
      const { task } = await load(session, taskId);
      const now = container.clock.now();
      await applyMove(task, to, now);
      const updated = await container.tasks.update(task.id, { updatedAt: now.toISOString() });
      return withCommentCount(updated!);
    },

    /** Deletes the task and its comments, and closes the gap in its column. */
    async delete(session: AppSession, taskId: string): Promise<void> {
      const { task } = await load(session, taskId);
      await container.comments.deleteByTasks([task.id]);
      await container.tasks.delete(task.id);
      const column = await container.tasks.list({ projectIds: [task.projectId], status: task.status });
      await container.tasks.updateMany(
        column.flatMap((t, position) => (t.position === position ? [] : [{ id: t.id, patch: { position } }])),
      );
    },
  };
}
