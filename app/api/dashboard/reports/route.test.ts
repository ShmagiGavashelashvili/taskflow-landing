import { describe, expect, it, vi } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer } from "@/tests/api";
import { POST as register } from "../../auth/register/route";
import { POST as createProject } from "../../projects/route";
import { POST as createTask } from "../../projects/[projectId]/tasks/route";
import { GET } from "./route";

const NOW = new Date("2026-10-14T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const test = setupTestContainer({ now: NOW });

interface ReportsBody {
  workload: Array<{ member: { id: string; name: string } | null; open: number; overdue: number }>;
  projects: Array<{ project: { id: string; name: string; color: string }; total: number; done: number; percent: number }>;
}

async function registerOn(plan: "free" | "pro") {
  const api = createTestApi();
  const res = await api.request(register, "/api/auth/register", {
    body: { name: "Sam", email: `sam-${plan}@example.dev`, password: "password123", workspaceName: "Sam Co", plan },
  });
  expect(res.status).toBe(201);
  return api;
}

describe("GET /api/dashboard/reports", () => {
  it("shows open and overdue tasks per member in join order, then unassigned", async () => {
    const api = await createLoggedInApi({ email: "tom@acme.studio" });
    const res = await api.request<ReportsBody>(GET, "/api/dashboard/reports");

    expect(res.status).toBe(200);
    expect(res.body.workload).toEqual([
      { member: { id: "usr_demo", name: "Alex Morgan" }, open: 5, overdue: 2 },
      { member: { id: "usr_priya", name: "Priya Shah" }, open: 4, overdue: 0 },
      { member: { id: "usr_marcus", name: "Marcus Chen" }, open: 4, overdue: 0 },
      { member: { id: "usr_lena", name: "Lena Fischer" }, open: 6, overdue: 2 },
      { member: { id: "usr_tom", name: "Tom Okafor" }, open: 5, overdue: 2 },
      { member: null, open: 7, overdue: 0 },
    ]);
  });

  it("shows completion progress per active project", async () => {
    const api = await createLoggedInApi();
    const res = await api.request<ReportsBody>(GET, "/api/dashboard/reports");

    expect(res.body.projects).toEqual([
      { project: { id: "prj_website", name: "Website Relaunch", color: "blue" }, total: 14, done: 3, percent: 21 },
      { project: { id: "prj_mobile", name: "Mobile App v2", color: "violet" }, total: 13, done: 3, percent: 23 },
      { project: { id: "prj_marketing", name: "Q4 Marketing", color: "amber" }, total: 13, done: 3, percent: 23 },
    ]);
  });

  it("is locked on the Free plan", async () => {
    const api = await registerOn("free");
    const res = await api.request(GET, "/api/dashboard/reports");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: { code: "PLAN_LIMIT_REACHED", message: "Reports is available on Pro and Business. Upgrade to unlock them." },
    });
  });

  it("is available during a Pro trial and locked once the trial expires", async () => {
    test.reset({ now: undefined }); // a real clock, so time can move
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    const api = await registerOn("pro");
    const project = await api.request<{ id: string }>(createProject, "/api/projects", { body: { name: "Launch" } });
    await api.request(createTask, `/api/projects/${project.body.id}/tasks`, {
      body: { title: "Ship it" },
      params: { projectId: project.body.id },
    });

    const during = await api.request<ReportsBody>(GET, "/api/dashboard/reports");
    expect(during.status).toBe(200);
    expect(during.body).toEqual({
      workload: [
        { member: { id: expect.any(String), name: "Sam" }, open: 0, overdue: 0 },
        { member: null, open: 1, overdue: 0 },
      ],
      projects: [{ project: { id: project.body.id, name: "Launch", color: "blue" }, total: 1, done: 0, percent: 0 }],
    });

    vi.setSystemTime(new Date(NOW.getTime() + 15 * DAY_MS));
    const after = await api.request(GET, "/api/dashboard/reports");
    expect(after.status).toBe(403);
    expect(after.body).toMatchObject({ error: { code: "PLAN_LIMIT_REACHED" } });
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/dashboard/reports")).status).toBe(401);
  });
});
