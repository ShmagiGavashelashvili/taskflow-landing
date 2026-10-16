import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer } from "@/tests/api";
import { POST as register } from "../../../auth/register/route";
import { GET, POST } from "./route";

// Pinned so the seed's relative due dates (and "overdue") are deterministic.
setupTestContainer({ now: new Date("2026-10-14T12:00:00.000Z") });

type Row = { id: string; title: string; status: string; position: number; commentCount: number };

const website = { params: { projectId: "prj_website" } };

async function list(query = "", account?: { email: string }) {
  const api = await createLoggedInApi(account);
  return api.request<Row[]>(GET, `/api/projects/prj_website/tasks${query}`, website);
}

const titles = (rows: Row[]) => rows.map((row) => row.title);

describe("GET /api/projects/:id/tasks", () => {
  it("lists the project's tasks in board order with comment counts", async () => {
    const res = await list("", { email: "lena@acme.studio" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(14);
    expect(res.body.map((t) => [t.status, t.position])).toEqual([
      ["todo", 0], ["todo", 1], ["todo", 2], ["todo", 3], ["todo", 4], ["todo", 5], ["todo", 6],
      ["in_progress", 0], ["in_progress", 1],
      ["in_review", 0], ["in_review", 1],
      ["done", 0], ["done", 1], ["done", 2],
    ]);
    expect(res.body.find((t) => t.title === "Write homepage copy")).toMatchObject({
      id: "tsk_website_03",
      projectId: "prj_website",
      priority: "high",
      assigneeId: "usr_lena",
      dueDate: "2026-10-15",
      commentCount: 2,
    });
    expect(res.body.find((t) => t.title === "Open Graph images")).toMatchObject({ commentCount: 0, dueDate: null });
  });

  it("filters by assignee", async () => {
    expect(titles((await list("?assigneeId=usr_tom")).body)).toEqual([
      "Set up CMS content models",
      "Build responsive navbar",
      "Cookie consent banner",
    ]);
  });

  it("filters for unassigned tasks", async () => {
    expect(titles((await list("?assigneeId=unassigned")).body)).toEqual([
      "Migrate blog posts",
      "Performance budget and Lighthouse checks",
      "Open Graph images",
    ]);
  });

  it("filters by priority", async () => {
    expect(titles((await list("?priority=urgent")).body)).toEqual(["Configure redirects from old URLs"]);
  });

  it("filters for open tasks due before today", async () => {
    expect(titles((await list("?overdue=true")).body)).toEqual([
      "Configure redirects from old URLs",
      "Build responsive navbar",
    ]);
  });

  it("searches titles case-insensitively", async () => {
    expect(titles((await list("?search=%20PAGE%20")).body)).toEqual([
      "Design pricing page",
      "Write homepage copy",
      "Define sitemap and page inventory",
    ]);
  });

  it("combines filters", async () => {
    expect(titles((await list("?priority=high&search=design")).body)).toEqual(["Design pricing page"]);
  });

  it("rejects invalid filters", async () => {
    const res = await list("?priority=critical&overdue=yes");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { priority: [expect.any(String)], overdue: [expect.any(String)] } },
    });
  });

  it("is 404 for an unknown project", async () => {
    const api = await createLoggedInApi();

    expect((await api.request(GET, "/api/projects/nope/tasks", { params: { projectId: "nope" } })).status).toBe(404);
  });

  it("is 404 for another workspace's project", async () => {
    const api = createTestApi();
    await api.request(register, "/api/auth/register", {
      body: { name: "Sam", email: "sam@other.co", password: "password123", workspaceName: "Other Co" },
    });

    expect((await api.request(GET, "/api/projects/prj_website/tasks", website)).status).toBe(404);
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/projects/prj_website/tasks", website)).status).toBe(401);
  });
});

describe("POST /api/projects/:id/tasks", () => {
  it("adds a task to the end of its column", async () => {
    const api = await createLoggedInApi({ email: "priya@acme.studio" });

    const res = await api.request(POST, "/api/projects/prj_website/tasks", {
      ...website,
      body: { title: "  Write FAQ  ", status: "in_review", priority: "high", assigneeId: "usr_marcus", dueDate: "2026-10-20" },
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      projectId: "prj_website",
      title: "Write FAQ",
      description: "",
      status: "in_review",
      position: 2,
      priority: "high",
      assigneeId: "usr_marcus",
      dueDate: "2026-10-20",
      createdBy: "usr_priya",
      createdAt: "2026-10-14T12:00:00.000Z",
      updatedAt: "2026-10-14T12:00:00.000Z",
      completedAt: null,
      commentCount: 0,
    });
    const review = (await list()).body.filter((t) => t.status === "in_review");
    expect(titles(review)).toEqual(["Write homepage copy", "Signup form validation", "Write FAQ"]);
  });

  it("defaults to an unassigned medium-priority to-do", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(POST, "/api/projects/prj_website/tasks", { ...website, body: { title: "Quick one" } });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: "todo", position: 7, priority: "medium", assigneeId: null, dueDate: null });
  });

  it("marks a task created in done as completed", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(POST, "/api/projects/prj_website/tasks", {
      ...website,
      body: { title: "Already shipped", status: "done" },
    });

    expect(res.body).toMatchObject({ status: "done", position: 3, completedAt: "2026-10-14T12:00:00.000Z" });
  });

  it("validates the task", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(POST, "/api/projects/prj_website/tasks", {
      ...website,
      body: { title: "", status: "blocked", dueDate: "next week" },
    });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: {
        fieldErrors: { title: [expect.any(String)], status: [expect.any(String)], dueDate: [expect.any(String)] },
      },
    });
  });

  it("only assigns workspace members", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(POST, "/api/projects/prj_website/tasks", {
      ...website,
      body: { title: "Orphan", assigneeId: "usr_stranger" },
    });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { assigneeId: [expect.any(String)] } } });
  });

  it("is 404 for an unknown project", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(POST, "/api/projects/nope/tasks", { params: { projectId: "nope" }, body: { title: "X" } });

    expect(res.status).toBe(404);
  });
});
