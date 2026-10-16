import "server-only";
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
  TaskPriority,
  TaskStatus,
  UserRecord,
  Workspace,
} from "@/server/domain/types";

/**
 * Storage interfaces, one per entity. Services depend on these only; `server/container.ts`
 * picks the implementation. Every method is async so a database can implement them.
 *
 * Conventions for every implementation:
 * - Returned objects are copies; mutating them doesn't change storage.
 * - `create` stores the entity as given (callers generate ids and timestamps) and returns it.
 * - `update` applies a partial patch and returns the updated entity, or `null` if not found.
 * - `delete` returns whether something was deleted. Repositories don't cascade; services do.
 * - Lists come back in a stable order documented on the method.
 */

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  /** Case-insensitive. */
  findByEmail(email: string): Promise<UserRecord | null>;
  findByIds(ids: readonly string[]): Promise<UserRecord[]>;
  create(user: UserRecord): Promise<UserRecord>;
  update(id: string, patch: Partial<Omit<UserRecord, "id">>): Promise<UserRecord | null>;
}

export interface WorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  create(workspace: Workspace): Promise<Workspace>;
  update(id: string, patch: Partial<Omit<Workspace, "id">>): Promise<Workspace | null>;
}

export interface MembershipRepository {
  find(userId: string, workspaceId: string): Promise<Membership | null>;
  /** In the order members joined. */
  listByWorkspace(workspaceId: string): Promise<Membership[]>;
  listByUser(userId: string): Promise<Membership[]>;
  create(membership: Membership): Promise<Membership>;
  delete(userId: string, workspaceId: string): Promise<boolean>;
}

export interface InviteRepository {
  findById(id: string): Promise<Invite | null>;
  findByToken(token: string): Promise<Invite | null>;
  /** Newest first. Includes accepted, revoked and expired invites; services filter. */
  listByWorkspace(workspaceId: string): Promise<Invite[]>;
  create(invite: Invite): Promise<Invite>;
  update(id: string, patch: Partial<Omit<Invite, "id">>): Promise<Invite | null>;
}

export interface ProjectQuery {
  workspaceId: string;
  /** Omit for both active and archived projects. */
  archived?: boolean;
}

export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  /** Oldest first. */
  list(query: ProjectQuery): Promise<Project[]>;
  create(project: Project): Promise<Project>;
  update(id: string, patch: Partial<Omit<Project, "id">>): Promise<Project | null>;
  delete(id: string): Promise<boolean>;
}

export interface TaskQuery {
  /** Required scope: tasks in any of these projects. */
  projectIds: readonly string[];
  status?: TaskStatus;
  /** A user id, or `null` for unassigned tasks. */
  assigneeId?: string | null;
  priority?: TaskPriority;
  /** Case-insensitive substring match on the title. */
  search?: string;
  /** Inclusive `YYYY-MM-DD` bounds on the due date; tasks without one are excluded when set. */
  dueFrom?: string;
  dueTo?: string;
  /** Exclude tasks in done (for "open" and "overdue" views). */
  excludeDone?: boolean;
}

export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  /** Ordered by status column (board order), then position. */
  list(query: TaskQuery): Promise<Task[]>;
  create(task: Task): Promise<Task>;
  update(id: string, patch: Partial<Omit<Task, "id">>): Promise<Task | null>;
  /** Applies several patches at once, e.g. renumbering a column after a move. */
  updateMany(patches: ReadonlyArray<{ id: string; patch: Partial<Omit<Task, "id">> }>): Promise<Task[]>;
  delete(id: string): Promise<boolean>;
  /** Returns how many tasks were deleted. */
  deleteByProject(projectId: string): Promise<number>;
}

export interface CommentRepository {
  findById(id: string): Promise<Comment | null>;
  /** Oldest first. */
  listByTask(taskId: string): Promise<Comment[]>;
  /** Comment count per task id; tasks without comments are absent. */
  countByTasks(taskIds: readonly string[]): Promise<Record<string, number>>;
  create(comment: Comment): Promise<Comment>;
  update(id: string, patch: Partial<Omit<Comment, "id">>): Promise<Comment | null>;
  delete(id: string): Promise<boolean>;
  deleteByTasks(taskIds: readonly string[]): Promise<number>;
}

export interface PasswordResetRepository {
  findByToken(token: string): Promise<PasswordReset | null>;
  create(reset: PasswordReset): Promise<PasswordReset>;
  update(token: string, patch: Partial<Omit<PasswordReset, "token">>): Promise<PasswordReset | null>;
}

export interface InvoiceRepository {
  /** Newest first. */
  listByWorkspace(workspaceId: string): Promise<Invoice[]>;
  create(invoice: Invoice): Promise<Invoice>;
}

export interface IntegrationRepository {
  /** Only integrations whose state was ever set; missing ones are disconnected. */
  listByWorkspace(workspaceId: string): Promise<IntegrationConnection[]>;
  /** Creates or replaces the state for one integration. */
  upsert(connection: IntegrationConnection): Promise<IntegrationConnection>;
}

export interface AutomationRepository {
  /** Only rules whose state was ever set; missing ones are disabled. */
  listByWorkspace(workspaceId: string): Promise<AutomationRule[]>;
  /** Creates or replaces the state for one rule. */
  upsert(rule: AutomationRule): Promise<AutomationRule>;
}

/** Everything the services need from storage. */
export interface Repositories {
  users: UserRepository;
  workspaces: WorkspaceRepository;
  memberships: MembershipRepository;
  invites: InviteRepository;
  projects: ProjectRepository;
  tasks: TaskRepository;
  comments: CommentRepository;
  passwordResets: PasswordResetRepository;
  invoices: InvoiceRepository;
  integrations: IntegrationRepository;
  automations: AutomationRepository;
}
