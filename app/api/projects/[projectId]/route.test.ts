import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer, type TestApi } from "@/tests/api";
import { POST as register } from "../../auth/register/route";
import { GET as listProjects, POST as createProject } from "../route";
import { DELETE, GET, PATCH } from "./route";

const testContainer = setupTestContainer();

const website = { params: { projectId: "prj_website" } };

function patch(api: TestApi, projectId: string, body: unknown) {
  return api.request(PATCH, `/api/projects/${projectId}`, { method: "PATCH", body, params: { projectId } });
}

async function outsiderApi() {
  const api = createTestApi();
  await api.request(register, "/api/auth/register", {
    body: { name: "Sam", email: "sam@other.co", password: "password123", workspaceName: "Other Co" },
  });
  return api;
}

describe("GET /api/projects/:id", () => {
  it("returns the project", async () => {
    const api = await createLoggedInApi({ email: "tom@acme.studio" });

    const res = await api.request(GET, "/api/projects/prj_website", website);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "prj_website", name: "Website Relaunch", color: "blue", archived: false });
  });

  it("is 404 for an unknown project", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(GET, "/api/projects/nope", { params: { projectId: "nope" } });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("is 404 for another workspace's project", async () => {
    const api = await outsiderApi();

    expect((await api.request(GET, "/api/projects/prj_website", website)).status).toBe(404);
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/projects/prj_website", website)).status).toBe(401);
  });
});

describe("PATCH /api/projects/:id", () => {
  it("renames and recolours", async () => {
    const api = await createLoggedInApi({ email: "lena@acme.studio" });

    const res = await patch(api, "prj_website", { name: "Website 2.0", color: "rose", description: "" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "prj_website", name: "Website 2.0", color: "rose", description: "" });
    expect((await api.request(GET, "/api/projects/prj_website", website)).body).toMatchObject({ name: "Website 2.0" });
  });

  it("archives and unarchives", async () => {
    const api = await createLoggedInApi({ email: "lena@acme.studio" });

    expect((await patch(api, "prj_website", { archived: true })).body).toMatchObject({ archived: true });
    expect((await patch(api, "prj_website", { archived: false })).body).toMatchObject({ archived: false });
  });

  it("validates the patch", async () => {
    const api = await createLoggedInApi();

    const res = await patch(api, "prj_website", { name: "", archived: "yes" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { fieldErrors: { name: [expect.any(String)], archived: [expect.any(String)] } },
    });
  });

  it("blocks unarchiving past the Free cap, but allows other edits to archived projects", async () => {
    const api = await createLoggedInApi();
    await patch(api, "prj_marketing", { archived: true });
    await api.request(createProject, "/api/projects", { body: { name: "Replacement" } });
    await testContainer.current.workspaces.update("ws_acme", { plan: "free" });

    const unarchive = await patch(api, "prj_marketing", { archived: false });
    const rename = await patch(api, "prj_marketing", { name: "Q4 Marketing (old)" });

    expect(unarchive.status).toBe(403);
    expect(unarchive.body).toMatchObject({ error: { code: "PLAN_LIMIT_REACHED" } });
    expect(rename.status).toBe(200);
  });

  it("is 404 for another workspace's project", async () => {
    expect((await patch(await outsiderApi(), "prj_website", { name: "Mine" })).status).toBe(404);
  });
});

describe("DELETE /api/projects/:id", () => {
  it("lets the owner delete a project with its tasks", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(DELETE, "/api/projects/prj_website", { method: "DELETE", ...website });

    expect(res.status).toBe(204);
    expect((await api.request(GET, "/api/projects/prj_website", website)).status).toBe(404);
    const names = (await api.request<Array<{ name: string }>>(listProjects, "/api/projects")).body.map((p) => p.name);
    expect(names).toEqual(["Mobile App v2", "Q4 Marketing"]);
    expect(await testContainer.current.tasks.findById("tsk_website_01")).toBeNull();
    expect(await testContainer.current.comments.findById("cmt_01")).toBeNull();
  });

  it("forbids members", async () => {
    const api = await createLoggedInApi({ email: "priya@acme.studio" });

    const res = await api.request(DELETE, "/api/projects/prj_website", { method: "DELETE", ...website });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "FORBIDDEN" } });
    expect((await api.request(GET, "/api/projects/prj_website", website)).status).toBe(200);
  });

  it("is 404 for another workspace's project", async () => {
    const api = await outsiderApi();

    expect((await api.request(DELETE, "/api/projects/prj_website", { method: "DELETE", ...website })).status).toBe(404);
  });
});
