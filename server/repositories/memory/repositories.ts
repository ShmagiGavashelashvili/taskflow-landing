import "server-only";
import { TASK_STATUSES } from "@/lib/schemas/entities";
import type { Task } from "@/server/domain/types";
import type { Repositories, TaskQuery } from "@/server/repositories/types";
import type { MemoryStore } from "./store";

const copy = <T>(value: T): T => structuredClone(value);
const copyOrNull = <T>(value: T | undefined): T | null => (value === undefined ? null : copy(value));
const newestFirst = <T>(items: T[], date: (item: T) => string) =>
  [...items].sort((a, b) => date(b).localeCompare(date(a)));

/** In-memory implementations of every repository, backed by one `MemoryStore`. */
export function createMemoryRepositories(store: MemoryStore): Repositories {
  const { db } = store;

  function insert<K extends keyof typeof db>(table: K, row: (typeof db)[K][number]) {
    (db[table] as (typeof row)[]).push(copy(row));
    store.commit();
    return copy(row);
  }

  function patchRow<T extends object>(row: T | undefined, patch: NoInfer<Partial<T>>): T | null {
    if (!row) return null;
    Object.assign(row, copy(patch));
    store.commit();
    return copy(row);
  }

  function removeWhere<K extends keyof typeof db>(table: K, match: (row: (typeof db)[K][number]) => boolean): number {
    const rows = db[table] as (typeof db)[K][number][];
    const kept = rows.filter((row) => !match(row));
    const removed = rows.length - kept.length;
    if (removed > 0) {
      rows.splice(0, rows.length, ...kept);
      store.commit();
    }
    return removed;
  }

  return {
    users: {
      findById: async (id) => copyOrNull(db.users.find((u) => u.id === id)),
      findByEmail: async (email) => {
        const normalised = email.trim().toLowerCase();
        return copyOrNull(db.users.find((u) => u.email.toLowerCase() === normalised));
      },
      findByIds: async (ids) => db.users.filter((u) => ids.includes(u.id)).map(copy),
      create: async (user) => insert("users", user),
      update: async (id, patch) => patchRow(db.users.find((u) => u.id === id), patch),
    },

    workspaces: {
      findById: async (id) => copyOrNull(db.workspaces.find((w) => w.id === id)),
      create: async (workspace) => insert("workspaces", workspace),
      update: async (id, patch) => patchRow(db.workspaces.find((w) => w.id === id), patch),
    },

    memberships: {
      find: async (userId, workspaceId) =>
        copyOrNull(db.memberships.find((m) => m.userId === userId && m.workspaceId === workspaceId)),
      listByWorkspace: async (workspaceId) => db.memberships.filter((m) => m.workspaceId === workspaceId).map(copy),
      listByUser: async (userId) => db.memberships.filter((m) => m.userId === userId).map(copy),
      create: async (membership) => insert("memberships", membership),
      delete: async (userId, workspaceId) =>
        removeWhere("memberships", (m) => m.userId === userId && m.workspaceId === workspaceId) > 0,
    },

    invites: {
      findById: async (id) => copyOrNull(db.invites.find((i) => i.id === id)),
      findByToken: async (token) => copyOrNull(db.invites.find((i) => i.token === token)),
      listByWorkspace: async (workspaceId) =>
        newestFirst(
          db.invites.filter((i) => i.workspaceId === workspaceId),
          (i) => i.expiresAt,
        ).map(copy),
      create: async (invite) => insert("invites", invite),
      update: async (id, patch) => patchRow(db.invites.find((i) => i.id === id), patch),
    },

    projects: {
      findById: async (id) => copyOrNull(db.projects.find((p) => p.id === id)),
      list: async ({ workspaceId, archived }) =>
        db.projects
          .filter((p) => p.workspaceId === workspaceId && (archived === undefined || p.archived === archived))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map(copy),
      create: async (project) => insert("projects", project),
      update: async (id, patch) => patchRow(db.projects.find((p) => p.id === id), patch),
      delete: async (id) => removeWhere("projects", (p) => p.id === id) > 0,
    },

    tasks: {
      findById: async (id) => copyOrNull(db.tasks.find((t) => t.id === id)),
      list: async (query) =>
        db.tasks
          .filter((task) => matchesTaskQuery(task, query))
          .sort(
            (a, b) => TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status) || a.position - b.position,
          )
          .map(copy),
      create: async (task) => insert("tasks", task),
      update: async (id, patch) => patchRow(db.tasks.find((t) => t.id === id), patch),
      updateMany: async (patches) => {
        const updated = patches.flatMap(({ id, patch }) => {
          const row = db.tasks.find((t) => t.id === id);
          if (!row) return [];
          Object.assign(row, copy(patch));
          return [copy(row)];
        });
        store.commit();
        return updated;
      },
      delete: async (id) => removeWhere("tasks", (t) => t.id === id) > 0,
      deleteByProject: async (projectId) => removeWhere("tasks", (t) => t.projectId === projectId),
    },

    comments: {
      findById: async (id) => copyOrNull(db.comments.find((c) => c.id === id)),
      listByTask: async (taskId) =>
        db.comments
          .filter((c) => c.taskId === taskId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map(copy),
      countByTasks: async (taskIds) => {
        const counts: Record<string, number> = {};
        for (const comment of db.comments) {
          if (taskIds.includes(comment.taskId)) counts[comment.taskId] = (counts[comment.taskId] ?? 0) + 1;
        }
        return counts;
      },
      create: async (comment) => insert("comments", comment),
      update: async (id, patch) => patchRow(db.comments.find((c) => c.id === id), patch),
      delete: async (id) => removeWhere("comments", (c) => c.id === id) > 0,
      deleteByTasks: async (taskIds) => removeWhere("comments", (c) => taskIds.includes(c.taskId)),
    },

    passwordResets: {
      findByToken: async (token) => copyOrNull(db.passwordResets.find((r) => r.token === token)),
      create: async (reset) => insert("passwordResets", reset),
      update: async (token, patch) => patchRow(db.passwordResets.find((r) => r.token === token), patch),
    },

    invoices: {
      listByWorkspace: async (workspaceId) =>
        newestFirst(
          db.invoices.filter((i) => i.workspaceId === workspaceId),
          (i) => i.issuedAt,
        ).map(copy),
      create: async (invoice) => insert("invoices", invoice),
    },

    integrations: {
      listByWorkspace: async (workspaceId) => db.integrations.filter((c) => c.workspaceId === workspaceId).map(copy),
      upsert: async (connection) => {
        removeWhere(
          "integrations",
          (c) => c.workspaceId === connection.workspaceId && c.integrationId === connection.integrationId,
        );
        return insert("integrations", connection);
      },
    },

    automations: {
      listByWorkspace: async (workspaceId) => db.automations.filter((r) => r.workspaceId === workspaceId).map(copy),
      upsert: async (rule) => {
        removeWhere("automations", (r) => r.workspaceId === rule.workspaceId && r.automationId === rule.automationId);
        return insert("automations", rule);
      },
    },
  };
}

function matchesTaskQuery(task: Task, query: TaskQuery) {
  if (!query.projectIds.includes(task.projectId)) return false;
  if (query.status !== undefined && task.status !== query.status) return false;
  if (query.assigneeId !== undefined && task.assigneeId !== query.assigneeId) return false;
  if (query.priority !== undefined && task.priority !== query.priority) return false;
  if (query.excludeDone && task.status === "done") return false;
  if (query.search && !task.title.toLowerCase().includes(query.search.trim().toLowerCase())) return false;
  if (query.dueFrom !== undefined || query.dueTo !== undefined) {
    if (task.dueDate === null) return false;
    if (query.dueFrom !== undefined && task.dueDate < query.dueFrom) return false;
    if (query.dueTo !== undefined && task.dueDate > query.dueTo) return false;
  }
  return true;
}
