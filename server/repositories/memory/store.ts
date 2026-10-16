import "server-only";
import fs from "node:fs";
import path from "node:path";
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

/** Every table of the mock store. JSON-serialisable, so it can be saved to disk as is. */
export interface MemoryDb {
  users: UserRecord[];
  workspaces: Workspace[];
  memberships: Membership[];
  invites: Invite[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  passwordResets: PasswordReset[];
  invoices: Invoice[];
  integrations: IntegrationConnection[];
  automations: AutomationRule[];
}

const TABLES: ReadonlyArray<keyof MemoryDb> = [
  "users",
  "workspaces",
  "memberships",
  "invites",
  "projects",
  "tasks",
  "comments",
  "passwordResets",
  "invoices",
  "integrations",
  "automations",
];

/**
 * Holds the mock data. With a `persistPath` (development only) it loads from that JSON file
 * when present and writes back after every change, so data survives dev-server restarts.
 */
export class MemoryStore {
  readonly db: MemoryDb;

  constructor(
    createInitial: () => MemoryDb,
    private readonly persistPath: string | null = null,
  ) {
    this.db = (persistPath && load(persistPath)) || createInitial();
    this.commit();
  }

  /** Call after every mutation. */
  commit(): void {
    if (!this.persistPath) return;
    fs.mkdirSync(path.dirname(this.persistPath), { recursive: true });
    fs.writeFileSync(this.persistPath, JSON.stringify(this.db, null, 2));
  }
}

function load(file: string): MemoryDb | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<MemoryDb>;
    // A file from an older shape is discarded rather than half-loaded.
    return TABLES.every((table) => Array.isArray(parsed[table])) ? (parsed as MemoryDb) : null;
  } catch {
    return null;
  }
}
