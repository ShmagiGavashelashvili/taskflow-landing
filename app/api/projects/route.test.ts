import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer } from "@/tests/api";
import { GET, POST } from "./route";
import { PATCH } from "./[projectId]/route";

const testContainer = setupTestContainer();

const SEEDED = ["Website Relaunch", "Mobile App v2", "Q4 Marketing"];

describe("GET /api/projects", () => {
  it("lists the workspace's projects, oldest first", async () => {
    const api = await createLoggedInApi({ email: "priya@acme.studio" });

    const res = await api.request<Array<{ name: string }>>(GET, "/api/projects");

    expect(res.status).toBe(200);
    expect(res.body.map((p) => p.name)).toEqual(SEEDED);
    expect(res.body[0]).toEqual({
      id: "prj_website",
      workspaceId: "ws_acme",
      name: "Website Relaunch",
      description: expect.any(String),
      color: "blue",
      archived: false,
      createdAt: expect.any(String),
    });
  });

  it("filters by archived state", async () => {
    const api = await createLoggedInApi();
    await api.request(PATCH, "/api/projects/prj_mobile", {
      method: "PATCH",
      body: { archived: true },
      params: { projectId: "prj_mobile" },
    });

    const active = await api.request<Array<{ name: string }>>(GET, "/api/projects?archived=false");
    const archived = await api.request<Array<{ name: string }>>(GET, "/api/projects?archived=true");

    expect(active.body.map((p) => p.name)).toEqual(["Website Relaunch", "Q4 Marketing"]);
    expect(archived.body.map((p) => p.name)).toEqual(["Mobile App v2"]);
  });

  it("rejects an invalid archived filter", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(GET, "/api/projects?archived=maybe");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { archived: [expect.any(String)] } } });
  });

  it("doesn't show another workspace's projects", async () => {
    const api = createTestApi();
    const { POST: register } = await import("../auth/register/route");
    await api.request(register, "/api/auth/register", {
      body: { name: "Sam", email: "sam@other.co", password: "password123", workspaceName: "Other Co" },
    });

    const res = await api.request<unknown[]>(GET, "/api/projects");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/projects")).status).toBe(401);
  });
});

describe("POST /api/projects", () => {
  it("creates a project any member can see", async () => {
    const api = await createLoggedInApi({ email: "marcus@acme.studio" });

    const res = await api.request(POST, "/api/projects", {
      body: { name: "  Brand refresh ", description: "New logo", color: "teal" },
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      workspaceId: "ws_acme",
      name: "Brand refresh",
      description: "New logo",
      color: "teal",
      archived: false,
      createdAt: expect.any(String),
    });
    const list = await (await createLoggedInApi()).request<Array<{ name: string }>>(GET, "/api/projects");
    expect(list.body.map((p) => p.name)).toContain("Brand refresh");
  });

  it("defaults the description and colour", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(POST, "/api/projects", { body: { name: "Ops" } });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Ops", description: "", color: "blue" });
  });

  it("validates the name and colour", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(POST, "/api/projects", { body: { name: " ", color: "neon" } });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { name: [expect.any(String)], color: [expect.any(String)] } },
    });
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(POST, "/api/projects", { body: { name: "X" } })).status).toBe(401);
  });

  describe("on Free (3 active projects)", () => {
    async function freeWorkspaceApi() {
      await testContainer.current.workspaces.update("ws_acme", { plan: "free" });
      return createLoggedInApi();
    }

    it("blocks a fourth active project with an upgrade prompt", async () => {
      const api = await freeWorkspaceApi();

      const res = await api.request(POST, "/api/projects", { body: { name: "Fourth" } });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ error: { code: "PLAN_LIMIT_REACHED", message: expect.stringMatching(/3 active projects/) } });
    });

    it("doesn't count archived projects", async () => {
      const api = await freeWorkspaceApi();
      await api.request(PATCH, "/api/projects/prj_marketing", {
        method: "PATCH",
        body: { archived: true },
        params: { projectId: "prj_marketing" },
      });

      expect((await api.request(POST, "/api/projects", { body: { name: "Fourth" } })).status).toBe(201);
    });

    it("applies to a trial that has ended", async () => {
      await testContainer.current.workspaces.update("ws_acme", {
        plan: "business",
        trialEndsAt: new Date(Date.now() - 60_000).toISOString(),
      });
      const api = await createLoggedInApi();

      expect((await api.request(POST, "/api/projects", { body: { name: "Fourth" } })).status).toBe(403);
    });
  });
});
