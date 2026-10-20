import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import type { createTaskRequestSchema, MoveTaskRequest, taskListQuerySchema, updateTaskRequestSchema, BoardTask, TaskDetail } from "@/lib/schemas/tasks";
import type { Person } from "@/lib/schemas/comments";
import { changedTasks, editTask, isoDate, removeTask } from "@/lib/tasks";
import { DAY_MS } from "@/lib/weeks";
import type { AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import type { Project, Task } from "@/server/domain/types";
import { loadPeople, withUsers } from "./people";
import { projectService } from "./projects";

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

  /** The task and its project, or `null` when either is missing or outside the session's workspace. */
  async function find(session: AppSession, taskId: string): Promise<{ task: Task; project: Project } | null> {
    const task = await container.tasks.findById(taskId);
    const project = task && (await container.projects.findById(task.projectId));
    return task && project && project.workspaceId === session.workspace.id ? { task, project } : null;
  }

  /** Like `find`, but throws NOT_FOUND. */
  async function load(session: AppSession, taskId: string): Promise<{ task: Task; project: Project }> {
    const found = await find(session, taskId);
    if (!found) throw new DomainError("NOT_FOUND", "That task doesn't exist or was deleted.");
    return found;
  }

  async function requireAssignable(session: AppSession, assigneeId: string | null | undefined) {
    if (!assigneeId) return;
    if (!(await container.memberships.find(assigneeId, session.workspace.id))) {
      throw new DomainError("VALIDATION_ERROR", "Please check the highlighted fields.", {
        assigneeId: ["Only workspace members can be assigned."],
      });
    }
  }

  /** Applies `change` to the project's tasks, saves only what differs, and returns the result. */
  async function saveChange(projectId: string, change: (tasks: Task[]) => Task[]): Promise<Task[]> {
    const before = await container.tasks.list({ projectIds: [projectId] });
    const after = change(before);
    const patches = changedTasks(before, after);
    if (patches.length > 0) await container.tasks.updateMany(patches);
    return after;
  }

  return {
    /** Everyone a task can be assigned to (workspace members, in join order): id and name only. */
    async assignees(session: AppSession): Promise<Person[]> {
      const memberships = await container.memberships.listByWorkspace(session.workspace.id);
      return (await withUsers(container, memberships)).map(({ user }) => ({ id: user.id, name: user.name }));
    },

    /** The task, or `null` when it doesn't exist or is outside the session's workspace. */
    async find(session: AppSession, taskId: string): Promise<Task | null> {
      return (await find(session, taskId))?.task ?? null;
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

    /** The task for its detail page: `get` plus the creator's name. */
    async detail(session: AppSession, taskId: string): Promise<TaskDetail> {
      const task = await withCommentCount((await load(session, taskId)).task);
      const people = await loadPeople(container, [task.createdBy]);
      return { ...task, creator: people.person(task.createdBy) };
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
      const after = await saveChange(task.projectId, (tasks) => editTask(tasks, task.id, patch, now));
      return withCommentCount(after.find((t) => t.id === task.id)!);
    },

    /** Places the task in a column at a position, renumbering its old and new columns. */
    async move(session: AppSession, taskId: string, to: MoveTaskRequest): Promise<BoardTask> {
      const { task } = await load(session, taskId);
      const now = container.clock.now();
      const after = await saveChange(task.projectId, (tasks) => editTask(tasks, task.id, to, now));
      return withCommentCount(after.find((t) => t.id === task.id)!);
    },

    /** Deletes the task and its comments, and closes the gap in its column. */
    async delete(session: AppSession, taskId: string): Promise<void> {
      const { task } = await load(session, taskId);
      await container.comments.deleteByTasks([task.id]);
      await saveChange(task.projectId, (tasks) => removeTask(tasks, task.id));
      await container.tasks.delete(task.id);
    },
  };
}
