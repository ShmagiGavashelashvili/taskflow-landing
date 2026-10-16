import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer } from "@/tests/api";
import { POST as register } from "../../../auth/register/route";
import { GET as getTask } from "../route";
import { GET, POST } from "./route";

const NOW = "2026-10-14T12:00:00.000Z";
setupTestContainer({ now: new Date(NOW) });

const params = (taskId: string) => ({ params: { taskId } });

async function outsiderApi() {
  const api = createTestApi();
  await api.request(register, "/api/auth/register", {
    body: { name: "Sam", email: "sam@other.co", password: "password123", workspaceName: "Other Co" },
  });
  return api;
}

describe("GET /api/tasks/:id/comments", () => {
  it("lists the task's comments oldest first, with their authors", async () => {
    const api = await createLoggedInApi({ email: "tom@acme.studio" });

    const res = await api.request(GET, "/api/tasks/tsk_website_03/comments", params("tsk_website_03"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({
        taskId: "tsk_website_03",
        body: "Love the new headline. Can we try a shorter subhead?",
        author: { id: "usr_demo", name: "Alex Morgan" },
        createdAt: "2026-10-13T06:00:00.000Z",
        editedAt: null,
      }),
      expect.objectContaining({
        body: "Shortened it and added two alternatives in the doc.",
        author: expect.objectContaining({ id: "usr_lena" }),
      }),
    ]);
  });

  it("is 404 for unknown tasks and other workspaces' tasks, and needs a session", async () => {
    const api = await createLoggedInApi();

    expect((await api.request(GET, "/api/tasks/nope/comments", params("nope"))).status).toBe(404);
    expect(
      (await (await outsiderApi()).request(GET, "/api/tasks/tsk_website_03/comments", params("tsk_website_03"))).status,
    ).toBe(404);
    expect((await createTestApi().request(GET, "/api/tasks/tsk_website_03/comments", params("tsk_website_03"))).status).toBe(401);
  });
});

describe("POST /api/tasks/:id/comments", () => {
  it("adds a comment by the signed-in user, which then shows in the thread and the task's count", async () => {
    const api = await createLoggedInApi({ email: "priya@acme.studio" });

    const res = await api.request(POST, "/api/tasks/tsk_website_06/comments", {
      body: { body: "  Starting on this today.  " },
      ...params("tsk_website_06"),
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      taskId: "tsk_website_06",
      body: "Starting on this today.",
      authorId: "usr_priya",
      author: { id: "usr_priya", name: "Priya Shah" },
      createdAt: NOW,
      editedAt: null,
    });
    const thread = await api.request<Array<{ body: string }>>(GET, "/api/tasks/tsk_website_06/comments", params("tsk_website_06"));
    expect(thread.body.map((c) => c.body)).toEqual(["Starting on this today."]);
    const task = await api.request<{ commentCount: number }>(getTask, "/api/tasks/tsk_website_06", params("tsk_website_06"));
    expect(task.body.commentCount).toBe(1);
  });

  it("rejects an empty comment with a field error", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(POST, "/api/tasks/tsk_website_06/comments", { body: { body: "   " }, ...params("tsk_website_06") });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { body: ["Write something first."] } } });
  });

  it("is 404 on other workspaces' tasks", async () => {
    const res = await (await outsiderApi()).request(POST, "/api/tasks/tsk_website_06/comments", {
      body: { body: "Hi" },
      ...params("tsk_website_06"),
    });

    expect(res.status).toBe(404);
  });
});
