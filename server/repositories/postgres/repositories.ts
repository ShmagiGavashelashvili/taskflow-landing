import "server-only";
import { TASK_STATUSES } from "@/lib/schemas/entities";
import type {
  AutomationRule,
  Comment,
  IntegrationConnection,
  Invite,
  Invoice,
  Membership,
  PasswordReset,
  Project,
  Task,
  UserRecord,
  Workspace,
} from "@/server/domain/types";
import type { Repositories, TaskQuery } from "@/server/repositories/types";
import { insertStatement, updateStatement, type Database, type Row } from "./database";
import { TABLES, toEntity, type TableDef } from "./tables";

const entities = <T>(rows: Row[]) => rows.map((row) => toEntity<T>(row));
const first = <T>(rows: Row[]): T | null => (rows[0] ? toEntity<T>(rows[0]) : null);

/** Postgres implementations of every repository, matching the memory store's behaviour. */
export function createPostgresRepositories(db: Database): Repositories {
  const find = async <T>(table: TableDef, where: string, params: unknown[]) =>
    first<T>(await db.query(`SELECT * FROM ${table.name} WHERE ${where} LIMIT 1`, params));

  const list = async <T>(table: TableDef, where: string, params: unknown[], order: string) =>
    entities<T>(await db.query(`SELECT * FROM ${table.name} WHERE ${where} ORDER BY ${order}`, params));

  const create = async <T extends object>(table: TableDef, row: T): Promise<T> => {
    const { text, params } = insertStatement(table, row as Row);
    return toEntity<T>((await db.query(text, params))[0]);
  };

  const upsert = async <T extends object>(table: TableDef, row: T): Promise<T> => {
    const { text, params } = insertStatement(table, row as Row, "UPSERT");
    return toEntity<T>((await db.query(text, params))[0]);
  };

  const update = async <T>(table: TableDef, keyValues: unknown[], patch: object): Promise<T | null> => {
    const statement = updateStatement(table, keyValues, patch as Row);
    if (!statement) {
      const where = table.key.map((property, index) => `${property.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)} = $${index + 1}`);
      return find<T>(table, where.join(" AND "), keyValues);
    }
    return first<T>(await db.query(statement.text, statement.params));
  };

  /** Deletes matching rows and returns how many went. */
  const remove = async (table: TableDef, where: string, params: unknown[]) =>
    (await db.query(`DELETE FROM ${table.name} WHERE ${where} RETURNING 1 AS removed`, params)).length;

  const { users, workspaces, memberships, invites, projects, tasks, comments, passwordResets, invoices } = TABLES;

  return {
    users: {
      findById: (id) => find<UserRecord>(users, "id = $1", [id]),
      findByEmail: (email) => find<UserRecord>(users, "lower(email) = $1", [email.trim().toLowerCase()]),
      findByIds: (ids) => (ids.length === 0 ? Promise.resolve([]) : list<UserRecord>(users, "id = ANY($1)", [ids], "seq")),
      create: (user) => create(users, user),
      update: (id, patch) => update<UserRecord>(users, [id], patch),
    },

    workspaces: {
      findById: (id) => find<Workspace>(workspaces, "id = $1", [id]),
      create: (workspace) => create(workspaces, workspace),
      update: (id, patch) => update<Workspace>(workspaces, [id], patch),
    },

    memberships: {
      find: (userId, workspaceId) => find<Membership>(memberships, "user_id = $1 AND workspace_id = $2", [userId, workspaceId]),
      listByWorkspace: (workspaceId) => list<Membership>(memberships, "workspace_id = $1", [workspaceId], "seq"),
      listByUser: (userId) => list<Membership>(memberships, "user_id = $1", [userId], "seq"),
      create: (membership) => create(memberships, membership),
      delete: async (userId, workspaceId) =>
        (await remove(memberships, "user_id = $1 AND workspace_id = $2", [userId, workspaceId])) > 0,
    },

    invites: {
      findById: (id) => find<Invite>(invites, "id = $1", [id]),
      findByToken: (token) => find<Invite>(invites, "token = $1", [token]),
      listByWorkspace: (workspaceId) => list<Invite>(invites, "workspace_id = $1", [workspaceId], "expires_at DESC, seq DESC"),
      create: (invite) => create(invites, invite),
      update: (id, patch) => update<Invite>(invites, [id], patch),
    },

    projects: {
      findById: (id) => find<Project>(projects, "id = $1", [id]),
      list: ({ workspaceId, archived }) =>
        archived === undefined
          ? list<Project>(projects, "workspace_id = $1", [workspaceId], "created_at, seq")
          : list<Project>(projects, "workspace_id = $1 AND archived = $2", [workspaceId, archived], "created_at, seq"),
      create: (project) => create(projects, project),
      update: (id, patch) => update<Project>(projects, [id], patch),
      delete: async (id) => (await remove(projects, "id = $1", [id])) > 0,
    },

    tasks: {
      findById: (id) => find<Task>(tasks, "id = $1", [id]),
      list: (query) => {
        const { where, params } = taskFilter(query);
        const statusOrder = `array_position(ARRAY[${TASK_STATUSES.map((s) => `'${s}'`).join(",")}], status)`;
        return list<Task>(tasks, where, params, `${statusOrder}, position, seq`);
      },
      create: (task) => create(tasks, task),
      update: (id, patch) => update<Task>(tasks, [id], patch),
      updateMany: async (patches) => {
        const statements = patches.flatMap(({ id, patch }) => updateStatement(tasks, [id], patch) ?? []);
        return (await db.transaction(statements)).flatMap((rows) => entities<Task>(rows));
      },
      delete: async (id) => (await remove(tasks, "id = $1", [id])) > 0,
      deleteByProject: (projectId) => remove(tasks, "project_id = $1", [projectId]),
    },

    comments: {
      findById: (id) => find<Comment>(comments, "id = $1", [id]),
      listByTask: (taskId) => list<Comment>(comments, "task_id = $1", [taskId], "created_at, seq"),
      countByTasks: async (taskIds) => {
        if (taskIds.length === 0) return {};
        const rows = await db.query(
          "SELECT task_id, count(*)::int AS total FROM comments WHERE task_id = ANY($1) GROUP BY task_id",
          [taskIds],
        );
        return Object.fromEntries(rows.map((row) => [row.task_id as string, row.total as number]));
      },
      create: (comment) => create(comments, comment),
      update: (id, patch) => update<Comment>(comments, [id], patch),
      delete: async (id) => (await remove(comments, "id = $1", [id])) > 0,
      deleteByTasks: (taskIds) => (taskIds.length === 0 ? Promise.resolve(0) : remove(comments, "task_id = ANY($1)", [taskIds])),
    },

    passwordResets: {
      findByToken: (token) => find<PasswordReset>(passwordResets, "token = $1", [token]),
      create: (reset) => create(passwordResets, reset),
      update: (token, patch) => update<PasswordReset>(passwordResets, [token], patch),
    },

    invoices: {
      listByWorkspace: (workspaceId) => list<Invoice>(invoices, "workspace_id = $1", [workspaceId], "issued_at DESC, seq DESC"),
      create: (invoice) => create(invoices, invoice),
    },

    integrations: {
      listByWorkspace: (workspaceId) => list<IntegrationConnection>(TABLES.integrations, "workspace_id = $1", [workspaceId], "seq"),
      upsert: (connection) => upsert(TABLES.integrations, connection),
    },

    automations: {
      listByWorkspace: (workspaceId) => list<AutomationRule>(TABLES.automations, "workspace_id = $1", [workspaceId], "seq"),
      upsert: (rule) => upsert(TABLES.automations, rule),
    },
  };
}

/** The `WHERE` clause for a task query, mirroring the memory store's filter. */
function taskFilter(query: TaskQuery): { where: string; params: unknown[] } {
  const params: unknown[] = [query.projectIds];
  const conditions = ["project_id = ANY($1)"];
  const add = (condition: string, value: unknown) => {
    params.push(value);
    conditions.push(condition.replace("?", `$${params.length}`));
  };

  if (query.status !== undefined) add("status = ?", query.status);
  if (query.assigneeId === null) conditions.push("assignee_id IS NULL");
  else if (query.assigneeId !== undefined) add("assignee_id = ?", query.assigneeId);
  if (query.priority !== undefined) add("priority = ?", query.priority);
  if (query.excludeDone) conditions.push("status <> 'done'");
  if (query.search) add("strpos(lower(title), ?) > 0", query.search.trim().toLowerCase());
  if (query.dueFrom !== undefined || query.dueTo !== undefined) {
    conditions.push("due_date IS NOT NULL");
    if (query.dueFrom !== undefined) add("due_date >= ?", query.dueFrom);
    if (query.dueTo !== undefined) add("due_date <= ?", query.dueTo);
  }
  return { where: conditions.join(" AND "), params };
}
