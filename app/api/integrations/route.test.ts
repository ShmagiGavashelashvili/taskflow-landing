import { describe, expect, it } from "vitest";
import type { IntegrationsResponse } from "@/lib/schemas/integrations";
import { createLoggedInApi, createTestApi, setupTestContainer, type TestApi } from "@/tests/api";
import { POST as changePlan } from "../billing/plan/route";
import { PATCH } from "./[integrationId]/route";
import { GET } from "./route";

setupTestContainer();

const MEMBER = { email: "priya@acme.studio" };

function toggle(api: TestApi, integrationId: string, connected: boolean) {
  return api.request(PATCH, `/api/integrations/${integrationId}`, { method: "PATCH", params: { integrationId }, body: { connected } });
}

async function downgradeToFree() {
  const owner = await createLoggedInApi();
  expect((await owner.request(changePlan, "/api/billing/plan", { body: { plan: "free", billingPeriod: "monthly" } })).status).toBe(200);
}

describe("GET /api/integrations", () => {
  it("lists the catalogue with the workspace's connections, for any member", async () => {
    const api = await createLoggedInApi(MEMBER);

    const res = await api.request<IntegrationsResponse>(GET, "/api/integrations");

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.integrations.map((i) => [i.name, i.connected])).toEqual([
      ["Slack", true],
      ["GitHub", true],
      ["GitLab", false],
      ["Google Drive", false],
      ["Figma", false],
      ["Zapier", false],
    ]);
  });

  it("reports integrations as unavailable on Free", async () => {
    await downgradeToFree();
    const api = await createLoggedInApi(MEMBER);

    const res = await api.request<IntegrationsResponse>(GET, "/api/integrations");

    expect(res.body.available).toBe(false);
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/integrations")).status).toBe(401);
  });
});

describe("PATCH /api/integrations/:integrationId", () => {
  it("connects and disconnects, and the state persists for the whole workspace", async () => {
    const priya = await createLoggedInApi(MEMBER);

    const connected = await toggle(priya, "figma", true);
    expect(connected.status).toBe(200);
    expect(connected.body).toMatchObject({ integration: { id: "figma", name: "Figma", connected: true } });
    expect((await toggle(priya, "slack", false)).status).toBe(200);

    const owner = await createLoggedInApi();
    const list = await owner.request<IntegrationsResponse>(GET, "/api/integrations");
    expect(list.body.integrations.filter((i) => i.connected).map((i) => i.id)).toEqual(["github", "figma"]);
  });

  it("is refused with an upgrade prompt on Free", async () => {
    await downgradeToFree();
    const api = await createLoggedInApi(MEMBER);

    const res = await toggle(api, "figma", true);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "PLAN_LIMIT_REACHED" } });
  });

  it("returns 404 for an unknown integration", async () => {
    const api = await createLoggedInApi();

    expect((await toggle(api, "myspace", true)).status).toBe(404);
  });

  it("validates the body", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(PATCH, "/api/integrations/figma", { method: "PATCH", params: { integrationId: "figma" }, body: { connected: "yes" } });

    expect(res.status).toBe(400);
  });
});
