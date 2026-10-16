import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer, type TestApi } from "@/tests/api";
import { POST as register } from "../../auth/register/route";
import { GET as listTasks } from "../../projects/[projectId]/tasks/route";
import { DELETE, GET, PATCH } from "./route";

const NOW = "2026-10-14T12:00:00.000Z";
const testContainer = setupTestContainer({ now: new Date(NOW) });

type Row = { id: string; title: string; status: string; position: number };

const params = (taskId: string) => ({ params: { taskId } });

function patch(api: TestApi, taskId: string, body: unknown) {
  return api.request(PATCH, `/api/tasks/${taskId}`, { method: "PATCH", body, ...params(taskId) });
}

async function column(api: TestApi, status: string) {
  const res = await api.request<Row[]>(listTasks, "/api/projects/prj_website/tasks", { params: { projectId: "prj_website" } });
  return res.body.filter((t) => t.status === status).map((t) => [t.title, t.position]);
}

async function outsiderApi() {
  const api = createTestApi();
  await api.request(register, "/api/auth/register", {
    body: { name: "Sam", email: "sam@other.co", password: "password123", workspaceName: "Other Co" },
  });
  return api;
}

describe("GET /api/tasks/:id", () => {
  it("returns the task with its comment count", async () => {
    const api = await createLoggedInApi({ email: "tom@acme.studio" });

    const res = await api.request(GET, "/api/tasks/tsk_website_03", params("tsk_website_03"));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "tsk_website_03", title: "Write homepage copy", projectId: "prj_website", commentCount: 2 });
  });

  it("is 404 for unknown tasks and other workspaces' tasks", async () => {
    const api = await createLoggedInApi();

    expect((await api.request(GET, "/api/tasks/nope", params("nope"))).status).toBe(404);
    expect((await (await outsiderApi()).request(GET, "/api/tasks/tsk_website_03", params("tsk_website_03"))).status).toBe(404);
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/tasks/tsk_website_03", params("tsk_website_03"))).status).toBe(401);
  });
});

describe("PATCH /api/tasks/:id", () => {
  it("edits fields and bumps updatedAt", async () => {
    const api = await createLoggedInApi({ email: "priya@acme.studio" });

    const res = await patch(api, "tsk_website_06", {
      title: "Set up CMS models",
      description: "Pages, posts and authors.",
      priority: "urgent",
      assigneeId: null,
      dueDate: "2026-11-01",
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: "tsk_website_06",
      title: "Set up CMS models",
      description: "Pages, posts and authors.",
      priority: "urgent",
      assigneeId: null,
      dueDate: "2026-11-01",
      status: "todo",
      position: 0,
      updatedAt: NOW,
    });
  });

  it("moves the task to the end of a new column when the status changes", async () => {
    const api = await createLoggedInApi();

    const res = await patch(api, "tsk_website_06", { status: "done" });

    expect(res.body).toMatchObject({ status: "done", position: 3, completedAt: NOW });
    expect((await column(api, "todo"))[0]).toEqual(["Migrate blog posts", 0]);
  });

  it("validates the patch and the assignee", async () => {
    const api = await createLoggedInApi();

    expect((await patch(api, "tsk_website_06", { title: " ", priority: "asap" })).body).toMatchObject({
      error: { fieldErrors: { title: [expect.any(String)], priority: [expect.any(String)] } },
    });
    expect((await patch(api, "tsk_website_06", { assigneeId: "usr_nobody" })).status).toBe(400);
  });

  it("is 404 for another workspace's task", async () => {
    expect((await patch(await outsiderApi(), "tsk_website_06", { title: "Mine" })).status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes the task and its comments and closes the gap in its column", async () => {
    const api = await createLoggedInApi({ email: "marcus@acme.studio" });

    const res = await api.request(DELETE, "/api/tasks/tsk_website_03", { method: "DELETE", ...params("tsk_website_03") });

    expect(res.status).toBe(204);
    expect((await api.request(GET, "/api/tasks/tsk_website_03", params("tsk_website_03"))).status).toBe(404);
    expect(await column(api, "in_review")).toEqual([["Signup form validation", 0]]);
    expect(await testContainer.current.comments.listByTask("tsk_website_03")).toEqual([]);
  });

  it("is 404 for another workspace's task", async () => {
    const api = await outsiderApi();

    expect((await api.request(DELETE, "/api/tasks/tsk_website_03", { method: "DELETE", ...params("tsk_website_03") })).status).toBe(404);
  });
});
