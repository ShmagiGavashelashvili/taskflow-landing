import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer, type TestApi } from "@/tests/api";
import { POST as register } from "../../../auth/register/route";
import { GET as listTasks } from "../../../projects/[projectId]/tasks/route";
import { POST } from "./route";

const NOW = "2026-10-14T12:00:00.000Z";
const container = setupTestContainer({ now: new Date(NOW) });

type Row = { id: string; status: string; position: number; completedAt: string | null };

function move(api: TestApi, taskId: string, body: unknown) {
  return api.request<Row>(POST, `/api/tasks/${taskId}/move`, { body, params: { taskId } });
}

/** Task ids per column, top to bottom. */
async function board(api: TestApi) {
  const res = await api.request<Row[]>(listTasks, "/api/projects/prj_website/tasks", { params: { projectId: "prj_website" } });
  const columns: Record<string, string[]> = { todo: [], in_progress: [], in_review: [], done: [] };
  for (const task of res.body) columns[task.status].push(`${task.id.replace("tsk_website_", "")}@${task.position}`);
  return columns;
}

describe("POST /api/tasks/:id/move", () => {
  it("reorders within a column", async () => {
    const api = await createLoggedInApi({ email: "lena@acme.studio" });

    const res = await move(api, "tsk_website_06", { status: "todo", position: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "tsk_website_06", status: "todo", position: 2, completedAt: null });
    expect((await board(api)).todo).toEqual(["07@0", "08@1", "06@2", "09@3", "10@4", "11@5", "14@6"]);
  });

  it("moves across columns and renumbers both", async () => {
    const api = await createLoggedInApi();

    await move(api, "tsk_website_07", { status: "in_progress", position: 1 });

    const columns = await board(api);
    expect(columns.todo).toEqual(["06@0", "08@1", "09@2", "10@3", "11@4", "14@5"]);
    expect(columns.in_progress).toEqual(["04@0", "07@1", "05@2"]);
  });

  it("puts a position past the end last", async () => {
    const api = await createLoggedInApi();

    const res = await move(api, "tsk_website_06", { status: "in_review", position: 99 });

    expect(res.body).toMatchObject({ status: "in_review", position: 2 });
  });

  it("sets completedAt when moved to done and clears it when moved out", async () => {
    const api = await createLoggedInApi();

    const done = await move(api, "tsk_website_05", { status: "done", position: 0 });
    expect(done.body).toMatchObject({ status: "done", position: 0, completedAt: NOW });
    expect((await board(api)).done).toEqual(["05@0", "01@1", "02@2", "12@3"]);

    const reopened = await move(api, "tsk_website_05", { status: "in_review", position: 0 });
    expect(reopened.body).toMatchObject({ status: "in_review", completedAt: null });
  });

  it("keeps the original completedAt when reordering within done", async () => {
    const api = await createLoggedInApi();

    const res = await move(api, "tsk_website_01", { status: "done", position: 2 });

    expect(res.body.completedAt).not.toBe(NOW);
    expect(res.body.completedAt).toEqual(expect.any(String));
  });

  it("validates the target", async () => {
    const api = await createLoggedInApi();

    const res = await move(api, "tsk_website_06", { status: "later", position: -1 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { status: [expect.any(String)], position: [expect.any(String)] } },
    });
  });

  it("is 404 for unknown tasks and other workspaces' tasks", async () => {
    const api = createTestApi();
    await api.request(register, "/api/auth/register", {
      body: { name: "Sam", email: "sam@other.co", password: "password123", workspaceName: "Other Co" },
    });

    expect((await move(api, "tsk_website_06", { status: "done", position: 0 })).status).toBe(404);
    expect((await move(await createLoggedInApi(), "nope", { status: "done", position: 0 })).status).toBe(404);
  });

  it("requires a session", async () => {
    expect((await move(createTestApi(), "tsk_website_06", { status: "done", position: 0 })).status).toBe(401);
  });
});

describe("simulated network on a move", () => {
  it("adds the mock latency once per request, not once per store call", async () => {
    const api = await createLoggedInApi();
    container.reset({ now: new Date(NOW), latencyMs: 80 });

    const started = performance.now();
    const res = await move(api, "tsk_website_07", { status: "in_progress", position: 1 });
    const elapsed = performance.now() - started;

    expect(res.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(75);
    // A move makes about ten store calls; per-call latency would take 800ms or more.
    expect(elapsed).toBeLessThan(240);
  });

  it("fails the whole request with UNAVAILABLE when the simulated network fails", async () => {
    const api = await createLoggedInApi();
    container.reset({ now: new Date(NOW), failureRate: 1 });

    const res = await move(api, "tsk_website_07", { status: "in_progress", position: 1 });

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ error: { code: "UNAVAILABLE" } });
  });
});
