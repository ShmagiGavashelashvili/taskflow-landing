import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer } from "@/tests/api";
import { POST as register } from "../auth/register/route";
import { PATCH as updateProject } from "../projects/[projectId]/route";
import { POST as moveTask } from "../tasks/[taskId]/move/route";
import { PATCH as updateTask } from "../tasks/[taskId]/route";
import { GET } from "./route";

// Wednesday 2026-10-14, so "this week" (Monday-based, UTC) started on 2026-10-12.
setupTestContainer({ now: new Date("2026-10-14T12:00:00.000Z") });

interface DashboardBody {
  stats: { open: number; completedThisWeek: number; overdue: number; byStatus: Record<string, number> };
  myTasks: Array<{ id: string; title: string; dueDate: string | null; projectId: string }>;
  projects: Array<{ id: string; name: string; color: string }>;
}

async function dashboard(account?: { email: string }) {
  const api = await createLoggedInApi(account);
  return api.request<DashboardBody>(GET, "/api/dashboard");
}

describe("GET /api/dashboard", () => {
  it("counts open, completed this week, overdue and per-status tasks across the workspace", async () => {
    const res = await dashboard();

    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({
      open: 31,
      completedThisWeek: 4,
      overdue: 6,
      byStatus: { todo: 19, in_progress: 7, in_review: 5, done: 9 },
    });
  });

  it("lists the signed-in user's open tasks, soonest due first", async () => {
    const res = await dashboard();

    expect(res.body.myTasks.map((task) => [task.title, task.dueDate, task.projectId])).toEqual([
      ["Budget review with finance", "2026-10-11", "prj_marketing"],
      ["Configure redirects from old URLs", "2026-10-13", "prj_website"],
      ["Biometric login", "2026-10-26", "prj_mobile"],
      ["Year-end newsletter draft", "2026-11-03", "prj_marketing"],
      ["Release notes for v2.0", "2026-11-13", "prj_mobile"],
    ]);
    expect(res.body.projects).toEqual([
      { id: "prj_website", name: "Website Relaunch", color: "blue" },
      { id: "prj_mobile", name: "Mobile App v2", color: "violet" },
      { id: "prj_marketing", name: "Q4 Marketing", color: "amber" },
    ]);
  });

  it("shows each member their own tasks", async () => {
    const res = await dashboard({ email: "priya@acme.studio" });

    expect(res.body.myTasks.map((task) => task.title)).toEqual([
      "Retargeting audience setup",
      "Webinar speaker outreach",
      "Beta tester onboarding flow",
      "Accessibility review",
    ]);
  });

  it("puts tasks without a due date after dated ones", async () => {
    const api = await createLoggedInApi();
    // "Tablet layout for board view" has no due date; it's unassigned in the seed.
    await api.request(updateTask, "/api/tasks/tsk_mobile_12", {
      method: "PATCH",
      body: { assigneeId: "usr_demo" },
      params: { taskId: "tsk_mobile_12" },
    });

    const res = await api.request<DashboardBody>(GET, "/api/dashboard");
    expect(res.body.myTasks.at(-1)).toMatchObject({ title: "Tablet layout for board view", dueDate: null });
  });

  it("leaves archived projects out", async () => {
    const api = await createLoggedInApi();
    await api.request(updateProject, "/api/projects/prj_marketing", {
      method: "PATCH",
      body: { archived: true },
      params: { projectId: "prj_marketing" },
    });

    const res = await api.request<DashboardBody>(GET, "/api/dashboard");
    expect(res.body.stats).toEqual({
      open: 21,
      completedThisWeek: 3,
      overdue: 4,
      byStatus: { todo: 13, in_progress: 5, in_review: 3, done: 6 },
    });
    expect(res.body.projects.map((project) => project.id)).toEqual(["prj_website", "prj_mobile"]);
    expect(res.body.myTasks.map((task) => task.projectId)).not.toContain("prj_marketing");
  });

  it("counts a task completed now as completed this week", async () => {
    const api = await createLoggedInApi();
    await api.request(moveTask, "/api/tasks/tsk_website_08/move", {
      body: { status: "done", position: 0 },
      params: { taskId: "tsk_website_08" },
    });

    const res = await api.request<DashboardBody>(GET, "/api/dashboard");
    expect(res.body.stats).toMatchObject({ open: 30, completedThisWeek: 5, overdue: 5 });
    expect(res.body.myTasks.map((task) => task.title)).not.toContain("Configure redirects from old URLs");
  });

  it("works on the Free plan, which has no reports", async () => {
    const api = createTestApi();
    await api.request(register, "/api/auth/register", {
      body: { name: "Sam Free", email: "sam@free.dev", password: "password123", workspaceName: "Freebies", plan: "free" },
    });

    const res = await api.request<DashboardBody>(GET, "/api/dashboard");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      stats: { open: 0, completedThisWeek: 0, overdue: 0, byStatus: { todo: 0, in_progress: 0, in_review: 0, done: 0 } },
      myTasks: [],
      projects: [],
    });
  });

  it("requires a session", async () => {
    const res = await createTestApi().request(GET, "/api/dashboard");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
  });
});
