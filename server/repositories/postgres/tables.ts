import "server-only";
import type { MemoryDb } from "@/server/repositories/memory/store";

/**
 * The Postgres schema, one entry per `MemoryDb` table. Column keys are the entity's property
 * names (stored as snake_case); values are the SQL type. Timestamps and dates stay ISO strings
 * (`text`), exactly as the domain model has them, so ordering and range checks behave the same
 * as in the memory store. There are no foreign keys: like the memory store, services cascade.
 */
export interface TableDef {
  name: string;
  columns: Record<string, string>;
  /** Columns that identify a row (the upsert and delete key). */
  key: readonly string[];
  /** Extra DDL, e.g. indexes. */
  extra?: readonly string[];
}

export const TABLES = {
  users: {
    name: "users",
    columns: { id: "text", name: "text", email: "text", passwordHash: "text", createdAt: "text" },
    key: ["id"],
    extra: ["CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email))"],
  },
  workspaces: {
    name: "workspaces",
    columns: { id: "text", name: "text", plan: "text", billingPeriod: "text", trialEndsAt: "text null", createdAt: "text" },
    key: ["id"],
  },
  memberships: {
    name: "memberships",
    columns: { userId: "text", workspaceId: "text", role: "text" },
    key: ["userId", "workspaceId"],
    extra: ["CREATE INDEX IF NOT EXISTS memberships_workspace_idx ON memberships (workspace_id)"],
  },
  invites: {
    name: "invites",
    columns: {
      id: "text",
      workspaceId: "text",
      email: "text",
      token: "text",
      invitedBy: "text",
      expiresAt: "text",
      acceptedAt: "text null",
      revokedAt: "text null",
    },
    key: ["id"],
    extra: [
      "CREATE UNIQUE INDEX IF NOT EXISTS invites_token_idx ON invites (token)",
      "CREATE INDEX IF NOT EXISTS invites_workspace_idx ON invites (workspace_id)",
    ],
  },
  projects: {
    name: "projects",
    columns: {
      id: "text",
      workspaceId: "text",
      name: "text",
      description: "text",
      color: "text",
      archived: "boolean",
      createdAt: "text",
    },
    key: ["id"],
    extra: ["CREATE INDEX IF NOT EXISTS projects_workspace_idx ON projects (workspace_id)"],
  },
  tasks: {
    name: "tasks",
    columns: {
      id: "text",
      projectId: "text",
      title: "text",
      description: "text",
      status: "text",
      position: "integer",
      priority: "text",
      assigneeId: "text null",
      dueDate: "text null",
      createdBy: "text",
      createdAt: "text",
      updatedAt: "text",
      completedAt: "text null",
    },
    key: ["id"],
    extra: ["CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks (project_id)"],
  },
  comments: {
    name: "comments",
    columns: { id: "text", taskId: "text", authorId: "text", body: "text", createdAt: "text", editedAt: "text null" },
    key: ["id"],
    extra: ["CREATE INDEX IF NOT EXISTS comments_task_idx ON comments (task_id)"],
  },
  passwordResets: {
    name: "password_resets",
    columns: { token: "text", userId: "text", expiresAt: "text", usedAt: "text null" },
    key: ["token"],
  },
  invoices: {
    name: "invoices",
    columns: {
      id: "text",
      workspaceId: "text",
      amount: "double precision",
      period: "text",
      status: "text",
      issuedAt: "text",
    },
    key: ["id"],
    extra: ["CREATE INDEX IF NOT EXISTS invoices_workspace_idx ON invoices (workspace_id)"],
  },
  integrations: {
    name: "integrations",
    columns: { workspaceId: "text", integrationId: "text", connected: "boolean", updatedAt: "text" },
    key: ["workspaceId", "integrationId"],
  },
  automations: {
    name: "automations",
    columns: { workspaceId: "text", automationId: "text", enabled: "boolean", updatedAt: "text" },
    key: ["workspaceId", "automationId"],
  },
} as const satisfies Record<keyof MemoryDb, TableDef>;

export const snake = (property: string) => property.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const camel = (column: string) => column.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

/** `CREATE TABLE` plus indexes for every table. `seq` records insertion order for stable lists. */
export function schemaStatements(): string[] {
  return (Object.values(TABLES) as TableDef[]).flatMap((table) => {
    const columns = Object.entries(table.columns).map(([property, type]) => {
      const nullable = type.endsWith(" null");
      return `${snake(property)} ${nullable ? type.slice(0, -5) : `${type} not null`}`;
    });
    const key = table.key.map(snake).join(", ");
    return [
      `CREATE TABLE IF NOT EXISTS ${table.name} (seq bigint generated always as identity, ${columns.join(", ")}, PRIMARY KEY (${key}))`,
      ...(table.extra ?? []),
    ];
  });
}

/** A database row as the entity it stores (snake_case keys to camelCase, `seq` dropped). */
export function toEntity<T>(row: Record<string, unknown>): T {
  const entity: Record<string, unknown> = {};
  for (const [column, value] of Object.entries(row)) {
    if (column !== "seq") entity[camel(column)] = value;
  }
  return entity as T;
}
