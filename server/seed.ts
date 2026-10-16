import "server-only";
import { hashPasswordSync } from "@/server/auth/password";
import type { Comment, Project, Task, TaskPriority, TaskStatus, UserRecord } from "@/server/domain/types";
import type { MemoryDb } from "@/server/repositories/memory/store";

/** The demo owner account, shown on the login page in demo mode. */
export const DEMO_ACCOUNT = { email: "demo@taskflow.app", password: "demo1234" } as const;

/** Every seeded user shares the demo password. */
export const SEED_PASSWORD = DEMO_ACCOUNT.password;

/** Stable ids of seeded records, for tests and links. */
export const SEED_IDS = {
  workspace: "ws_acme",
  users: {
    demo: "usr_demo",
    priya: "usr_priya",
    marcus: "usr_marcus",
    lena: "usr_lena",
    tom: "usr_tom",
  },
  projects: {
    website: "prj_website",
    mobile: "prj_mobile",
    marketing: "prj_marketing",
  },
} as const;

type SeedUserKey = keyof typeof SEED_IDS.users;
type SeedProjectKey = keyof typeof SEED_IDS.projects;

const USERS: ReadonlyArray<{ key: SeedUserKey; name: string; email: string; role: "owner" | "member" }> = [
  { key: "demo", name: "Alex Morgan", email: DEMO_ACCOUNT.email, role: "owner" },
  { key: "priya", name: "Priya Shah", email: "priya@acme.studio", role: "member" },
  { key: "marcus", name: "Marcus Chen", email: "marcus@acme.studio", role: "member" },
  { key: "lena", name: "Lena Fischer", email: "lena@acme.studio", role: "member" },
  { key: "tom", name: "Tom Okafor", email: "tom@acme.studio", role: "member" },
];

const PROJECTS: ReadonlyArray<Omit<Project, "id" | "workspaceId" | "archived" | "createdAt"> & { key: SeedProjectKey }> = [
  {
    key: "website",
    name: "Website Relaunch",
    description: "New marketing site with a refreshed brand, faster pages and a self-serve signup.",
    color: "blue",
  },
  {
    key: "mobile",
    name: "Mobile App v2",
    description: "Offline mode, push notifications and a redesigned task view for iOS and Android.",
    color: "violet",
  },
  {
    key: "marketing",
    name: "Q4 Marketing",
    description: "Holiday campaign, webinar series and the year-end customer newsletter.",
    color: "amber",
  },
];

/** [title, status, priority, assignee, due in days from today (negative = overdue) or null]. */
type TaskRow = [string, TaskStatus, TaskPriority, SeedUserKey | null, number | null];

const TASKS: Record<SeedProjectKey, TaskRow[]> = {
  website: [
    ["Audit current site analytics", "done", "medium", "priya", -12],
    ["Define sitemap and page inventory", "done", "high", "demo", -8],
    ["Write homepage copy", "in_review", "high", "lena", 1],
    ["Design pricing page", "in_progress", "high", "marcus", 3],
    ["Build responsive navbar", "in_progress", "medium", "tom", -2],
    ["Set up CMS content models", "todo", "medium", "tom", 6],
    ["Migrate blog posts", "todo", "low", null, 18],
    ["Configure redirects from old URLs", "todo", "urgent", "demo", -1],
    ["Accessibility review", "todo", "high", "priya", 10],
    ["Performance budget and Lighthouse checks", "todo", "medium", null, 14],
    ["Launch announcement email", "todo", "low", "lena", 21],
    ["Cookie consent banner", "done", "medium", "tom", -5],
    ["Signup form validation", "in_review", "medium", "marcus", 0],
    ["Open Graph images", "todo", "low", null, null],
  ],
  mobile: [
    ["Offline sync architecture spike", "done", "urgent", "marcus", -20],
    ["Local database schema", "done", "high", "tom", -10],
    ["Push notification service", "in_progress", "high", "marcus", 2],
    ["Redesign task detail screen", "in_progress", "medium", "lena", 4],
    ["Dark mode color tokens", "in_review", "low", "lena", -3],
    ["Conflict resolution for offline edits", "todo", "urgent", "tom", 7],
    ["Biometric login", "todo", "medium", "demo", 12],
    ["Crash reporting setup", "done", "medium", "priya", -2],
    ["App Store screenshots", "todo", "low", null, 25],
    ["Beta tester onboarding flow", "todo", "medium", "priya", 9],
    ["Fix sync spinner never stopping", "in_progress", "urgent", "tom", -4],
    ["Tablet layout for board view", "todo", "low", null, null],
    ["Release notes for v2.0", "todo", "low", "demo", 30],
  ],
  marketing: [
    ["Holiday campaign brief", "done", "high", "demo", -15],
    ["Webinar speaker outreach", "in_progress", "medium", "priya", 5],
    ["Landing page for webinar series", "todo", "medium", "marcus", 8],
    ["Customer story: Brightpeak", "in_review", "medium", "lena", 2],
    ["Paid social creative", "in_progress", "high", "lena", -6],
    ["Newsletter template refresh", "done", "low", "priya", -1],
    ["Year-end newsletter draft", "todo", "medium", "demo", 20],
    ["Partner co-marketing plan", "todo", "low", null, 28],
    ["Budget review with finance", "todo", "urgent", "demo", -3],
    ["SEO keyword research", "done", "medium", "marcus", -9],
    ["Holiday discount codes", "todo", "high", "tom", 4],
    ["Campaign performance dashboard", "todo", "medium", null, null],
    ["Retargeting audience setup", "in_review", "medium", "priya", 1],
  ],
};

/** [project, task index in that project's list, author, body, hours ago]. */
const COMMENTS: ReadonlyArray<[SeedProjectKey, number, SeedUserKey, string, number]> = [
  ["website", 2, "demo", "Love the new headline. Can we try a shorter subhead?", 30],
  ["website", 2, "lena", "Shortened it and added two alternatives in the doc.", 26],
  ["website", 3, "priya", "Annual toggle should default to yearly, it converts better.", 50],
  ["website", 3, "marcus", "Agreed, updated the mockup.", 44],
  ["website", 4, "tom", "Mobile menu is done, still fixing focus trapping.", 20],
  ["website", 7, "demo", "Blocking launch: old /pricing links are already in emails.", 6],
  ["mobile", 2, "marcus", "APNs is working; FCM next.", 15],
  ["mobile", 4, "lena", "Contrast on secondary text fails in dark mode, fixing.", 40],
  ["mobile", 10, "priya", "Repro: airplane mode on, edit a task, airplane mode off.", 10],
  ["mobile", 10, "tom", "Found it, the retry queue never resolves on 409s.", 4],
  ["marketing", 3, "demo", "Brightpeak approved the quotes, good to publish.", 22],
  ["marketing", 4, "lena", "First round of ads is underperforming, trying new copy.", 12],
  ["marketing", 8, "priya", "Finance wants numbers by Friday.", 3],
];

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const passwordHashes = new Map<string, string>();

/** scrypt is slow on purpose; seed hashes are computed once per process. */
function seedPasswordHash(userId: string): string {
  let hash = passwordHashes.get(userId);
  if (!hash) {
    hash = hashPasswordSync(SEED_PASSWORD, `seed-${userId}`);
    passwordHashes.set(userId, hash);
  }
  return hash;
}

/**
 * The demo workspace "Acme Studio", with every date relative to `now` so the data always has
 * overdue tasks, tasks due this week and later, and tasks completed this week.
 */
export function createSeedData(now: Date): MemoryDb {
  const at = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();
  const dateIn = (days: number) => at(days * DAY).slice(0, 10);
  const workspaceId = SEED_IDS.workspace;
  const userId = (key: SeedUserKey) => SEED_IDS.users[key];

  const users: UserRecord[] = USERS.map((user, index) => ({
    id: userId(user.key),
    name: user.name,
    email: user.email,
    passwordHash: seedPasswordHash(userId(user.key)),
    createdAt: at(-(120 - index * 5) * DAY),
  }));

  const projects: Project[] = PROJECTS.map(({ key, ...project }, index) => ({
    id: SEED_IDS.projects[key],
    workspaceId,
    ...project,
    archived: false,
    createdAt: at(-(90 - index * 20) * DAY),
  }));

  const tasks: Task[] = [];
  const taskIds = {} as Record<SeedProjectKey, string[]>;
  for (const [projectKey, rows] of Object.entries(TASKS) as [SeedProjectKey, TaskRow[]][]) {
    const positions: Partial<Record<TaskStatus, number>> = {};
    taskIds[projectKey] = rows.map(([title, status, priority, assignee, dueInDays], index) => {
      const id = `tsk_${projectKey}_${String(index + 1).padStart(2, "0")}`;
      const position = positions[status] ?? 0;
      positions[status] = position + 1;
      const createdDaysAgo = 30 - index;
      // Done tasks finished between today and ten days ago, so some count as "this week".
      const completedAt = status === "done" ? at(-((index * 3) % 10) * DAY - HOUR) : null;
      tasks.push({
        id,
        projectId: SEED_IDS.projects[projectKey],
        title,
        description: "",
        status,
        position,
        priority,
        assigneeId: assignee && userId(assignee),
        dueDate: dueInDays === null ? null : dateIn(dueInDays),
        createdBy: userId(USERS[index % USERS.length].key),
        createdAt: at(-createdDaysAgo * DAY),
        updatedAt: completedAt ?? at(-Math.min(createdDaysAgo, index % 4) * DAY),
        completedAt,
      });
      return id;
    });
  }

  const comments: Comment[] = COMMENTS.map(([projectKey, taskIndex, author, body, hoursAgo], index) => ({
    id: `cmt_${String(index + 1).padStart(2, "0")}`,
    taskId: taskIds[projectKey][taskIndex],
    authorId: userId(author),
    body,
    createdAt: at(-hoursAgo * HOUR),
    editedAt: null,
  }));

  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const twoMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  const period = (date: Date) => date.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  // Pro monthly: $15 per member per month.
  const monthlyTotal = 15 * USERS.length;

  return {
    users,
    workspaces: [
      {
        id: workspaceId,
        name: "Acme Studio",
        plan: "pro",
        billingPeriod: "monthly",
        trialEndsAt: null,
        createdAt: at(-120 * DAY),
      },
    ],
    memberships: USERS.map((user) => ({ userId: userId(user.key), workspaceId, role: user.role })),
    invites: [],
    projects,
    tasks,
    comments,
    passwordResets: [],
    invoices: [
      {
        id: "inv_002",
        workspaceId,
        amount: monthlyTotal,
        period: period(lastMonth),
        status: "paid",
        issuedAt: lastMonth.toISOString(),
      },
      {
        id: "inv_001",
        workspaceId,
        amount: monthlyTotal,
        period: period(twoMonthsAgo),
        status: "paid",
        issuedAt: twoMonthsAgo.toISOString(),
      },
    ],
    integrations: [
      { workspaceId, integrationId: "slack", connected: true, updatedAt: at(-60 * DAY) },
      { workspaceId, integrationId: "github", connected: true, updatedAt: at(-45 * DAY) },
    ],
    automations: [
      { workspaceId, automationId: "notify-assignee-on-done", enabled: true, updatedAt: at(-30 * DAY) },
    ],
  };
}
