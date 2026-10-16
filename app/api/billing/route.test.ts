import { afterEach, describe, expect, it, vi } from "vitest";
import type { BillingResponse } from "@/lib/schemas/billing";
import { createLoggedInApi, createTestApi, setupTestContainer } from "@/tests/api";
import { POST as register } from "../auth/register/route";
import { GET } from "./route";

setupTestContainer();
afterEach(() => vi.useRealTimers());

describe("GET /api/billing", () => {
  it("shows the owner the plan, period, limits, usage and the plan catalogue with landing-page prices", async () => {
    const api = await createLoggedInApi();

    const res = await api.request<BillingResponse>(GET, "/api/billing");

    expect(res.status).toBe(200);
    expect(res.body.subscription).toEqual({
      plan: "pro",
      effectivePlan: "pro",
      billingPeriod: "monthly",
      trial: { endsAt: null, daysLeft: null, expired: false },
      limits: {
        maxMembers: null,
        maxActiveProjects: null,
        features: { timeline: true, reports: true, integrations: true, automations: true },
      },
      usage: { members: 5, pendingInvites: 0, activeProjects: 3 },
    });
    expect(res.body.plans.map((p) => [p.id, p.name, p.monthly, p.yearly])).toEqual([
      ["free", "Free", 0, 0],
      ["pro", "Pro", 15, 12],
      ["business", "Business", 30, 24],
    ]);
    expect(res.body.plans[0].limits).toMatchObject({ maxMembers: 5, maxActiveProjects: 3 });
  });

  it("reports trial days left, and an expired trial as Free", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const api = createTestApi();
    await api.request(register, "/api/auth/register", {
      body: { name: "Sam Rivera", email: "sam@example.com", password: "correct horse", workspaceName: "Rivera Labs", plan: "business" },
    });

    vi.setSystemTime(new Date("2026-10-20T12:00:00.000Z"));
    const during = await api.request<BillingResponse>(GET, "/api/billing");
    expect(during.body.subscription).toMatchObject({
      plan: "business",
      effectivePlan: "business",
      trial: { endsAt: "2026-10-30T12:00:00.000Z", daysLeft: 10, expired: false },
    });

    vi.setSystemTime(new Date("2026-10-31T12:00:00.000Z"));
    const after = await api.request<BillingResponse>(GET, "/api/billing");
    expect(after.body.subscription).toMatchObject({
      plan: "business",
      effectivePlan: "free",
      trial: { daysLeft: 0, expired: true },
      limits: { maxMembers: 5, maxActiveProjects: 3 },
    });
  });

  it("is owner only", async () => {
    const api = await createLoggedInApi({ email: "priya@acme.studio" });

    const res = await api.request(GET, "/api/billing");

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/billing")).status).toBe(401);
  });
});
