import { afterEach, describe, expect, it, vi } from "vitest";
import type { AutomationsResponse } from "@/lib/schemas/integrations";
import { createLoggedInApi, createTestApi, setupTestContainer, type TestApi } from "@/tests/api";
import { POST as register } from "../auth/register/route";
import { PATCH } from "./[automationId]/route";
import { GET } from "./route";

setupTestContainer();
afterEach(() => vi.useRealTimers());

const MEMBER = { email: "priya@acme.studio" };

function toggle(api: TestApi, automationId: string, enabled: boolean) {
  return api.request(PATCH, `/api/automations/${automationId}`, { method: "PATCH", params: { automationId }, body: { enabled } });
}

describe("GET /api/automations", () => {
  it("lists the preset rules with the workspace's state, for any member", async () => {
    const api = await createLoggedInApi(MEMBER);

    const res = await api.request<AutomationsResponse>(GET, "/api/automations");

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.automations.map((a) => [a.id, a.enabled])).toEqual([
      ["notify-assignee-on-done", true],
      ["assign-creator-on-create", false],
      ["move-to-review-on-comment", false],
      ["flag-overdue-as-urgent", false],
    ]);
    expect(res.body.automations[0].description).toBe("When a task moves to Done, notify the assignee.");
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/automations")).status).toBe(401);
  });
});

describe("PATCH /api/automations/:automationId", () => {
  it("enables and disables rules, persisted for the workspace", async () => {
    const priya = await createLoggedInApi(MEMBER);

    const res = await toggle(priya, "flag-overdue-as-urgent", true);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ automation: { id: "flag-overdue-as-urgent", enabled: true } });
    expect((await toggle(priya, "notify-assignee-on-done", false)).status).toBe(200);

    const owner = await createLoggedInApi();
    const list = await owner.request<AutomationsResponse>(GET, "/api/automations");
    expect(list.body.automations.filter((a) => a.enabled).map((a) => a.id)).toEqual(["flag-overdue-as-urgent"]);
  });

  it("is gated once a trial has expired", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const api = createTestApi();
    await api.request(register, "/api/auth/register", {
      body: { name: "Sam Rivera", email: "sam@example.com", password: "correct horse", workspaceName: "Rivera Labs", plan: "pro" },
    });
    expect((await toggle(api, "flag-overdue-as-urgent", true)).status).toBe(200);

    vi.setSystemTime(new Date("2026-10-31T12:00:00.000Z"));
    const res = await toggle(api, "flag-overdue-as-urgent", false);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "PLAN_LIMIT_REACHED" } });
    const list = await api.request<AutomationsResponse>(GET, "/api/automations");
    expect(list.body).toMatchObject({ available: false });
  });

  it("returns 404 for an unknown rule", async () => {
    const api = await createLoggedInApi();

    expect((await toggle(api, "make-coffee", true)).status).toBe(404);
  });
});
