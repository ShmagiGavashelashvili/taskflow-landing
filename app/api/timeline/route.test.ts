import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer } from "@/tests/api";
import { POST as register } from "../auth/register/route";
import { PATCH as updateProject } from "../projects/[projectId]/route";
import { GET } from "./route";

// Wednesday 2026-10-14: the current week runs Monday 2026-10-12 to Sunday 2026-10-18.
setupTestContainer({ now: new Date("2026-10-14T12:00:00.000Z") });

interface TimelineBody {
  from: string;
  to: string;
  projects: Array<{ id: string; name: string; color: string }>;
  tasks: Array<{ id: string; title: string; dueDate: string; projectId: string; status: string }>;
}

async function timeline(query = "") {
  const api = await createLoggedInApi({ email: "marcus@acme.studio" });
  return api.request<TimelineBody>(GET, `/api/timeline${query}`);
}

const rows = (body: TimelineBody) => body.tasks.map((task) => [task.dueDate, task.title]);

describe("GET /api/timeline", () => {
  it("defaults to this week: tasks due Monday to Sunday by date, then project, done ones included", async () => {
    const res = await timeline();

    expect(res.status).toBe(200);
    expect(res.body.from).toBe("2026-10-12");
    expect(res.body.to).toBe("2026-10-18");
    expect(res.body.projects.map((project) => project.name)).toEqual(["Website Relaunch", "Mobile App v2", "Q4 Marketing"]);
    expect(rows(res.body)).toEqual([
      ["2026-10-12", "Build responsive navbar"],
      ["2026-10-12", "Crash reporting setup"],
      ["2026-10-13", "Configure redirects from old URLs"],
      ["2026-10-13", "Newsletter template refresh"],
      ["2026-10-14", "Signup form validation"],
      ["2026-10-15", "Write homepage copy"],
      ["2026-10-15", "Retargeting audience setup"],
      ["2026-10-16", "Push notification service"],
      ["2026-10-16", "Customer story: Brightpeak"],
      ["2026-10-17", "Design pricing page"],
      ["2026-10-18", "Redesign task detail screen"],
      ["2026-10-18", "Holiday discount codes"],
    ]);
    expect(res.body.tasks.find((task) => task.title === "Crash reporting setup")).toMatchObject({
      id: "tsk_mobile_08",
      projectId: "prj_mobile",
      status: "done",
    });
  });

  it("returns tasks due within an inclusive date range", async () => {
    const res = await timeline("?from=2026-10-19&to=2026-10-24");

    expect(res.body).toMatchObject({ from: "2026-10-19", to: "2026-10-24" });
    expect(rows(res.body)).toEqual([
      ["2026-10-19", "Webinar speaker outreach"],
      ["2026-10-20", "Set up CMS content models"],
      ["2026-10-21", "Conflict resolution for offline edits"],
      ["2026-10-22", "Landing page for webinar series"],
      ["2026-10-23", "Beta tester onboarding flow"],
      ["2026-10-24", "Accessibility review"],
    ]);
  });

  it("filters by project", async () => {
    const res = await timeline("?projectId=prj_mobile");

    expect(res.body.projects).toEqual([{ id: "prj_mobile", name: "Mobile App v2", color: "violet" }]);
    expect(rows(res.body)).toEqual([
      ["2026-10-12", "Crash reporting setup"],
      ["2026-10-16", "Push notification service"],
      ["2026-10-18", "Redesign task detail screen"],
    ]);
  });

  it("leaves archived projects out", async () => {
    const api = await createLoggedInApi();
    await api.request(updateProject, "/api/projects/prj_mobile", {
      method: "PATCH",
      body: { archived: true },
      params: { projectId: "prj_mobile" },
    });

    const res = await api.request<TimelineBody>(GET, "/api/timeline");
    expect(res.body.projects.map((project) => project.id)).toEqual(["prj_website", "prj_marketing"]);
    expect(res.body.tasks.map((task) => task.projectId)).not.toContain("prj_mobile");
  });

  it("rejects a range that ends before it starts", async () => {
    const res = await timeline("?from=2026-10-19&to=2026-10-18");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { to: ["The end date must be on or after the start date."] } },
    });
  });

  it("rejects ranges longer than 92 days and malformed dates", async () => {
    expect((await timeline("?from=2026-10-01&to=2027-01-02")).body).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { to: ["Pick a range of 92 days or less."] } },
    });
    expect((await timeline("?from=2026-10-01&to=2026-12-31")).status).toBe(200);
    expect((await timeline("?from=next-week")).body).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { from: [expect.any(String)] } },
    });
  });

  it("is 404 for a project outside the workspace", async () => {
    const res = await timeline("?projectId=prj_nope");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("is locked on the Free plan", async () => {
    const api = createTestApi();
    await api.request(register, "/api/auth/register", {
      body: { name: "Sam", email: "sam@free.dev", password: "password123", workspaceName: "Sam Co", plan: "free" },
    });

    const res = await api.request(GET, "/api/timeline");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: { code: "PLAN_LIMIT_REACHED", message: "Timeline is available on Pro and Business. Upgrade to unlock them." },
    });
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/timeline")).status).toBe(401);
  });
});
