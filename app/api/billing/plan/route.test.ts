import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChangePlanRequest, ChangePlanResponse, InvoicesResponse } from "@/lib/schemas/billing";
import { SEED_IDS } from "@/server/seed";
import { createLoggedInApi, createTestApi, setupTestContainer, type TestApi } from "@/tests/api";
import { POST as register } from "../../auth/register/route";
import { POST as invite } from "../../workspace/invites/route";
import { GET as listInvoices } from "../invoices/route";
import { POST } from "./route";

const container = setupTestContainer();
afterEach(() => vi.useRealTimers());

const TEST_CARD = { cardNumber: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" };

function changePlan(api: TestApi, body: ChangePlanRequest) {
  return api.request<ChangePlanResponse>(POST, "/api/billing/plan", { body });
}

async function registerTrial(plan: "pro" | "business") {
  const api = createTestApi();
  const res = await api.request(register, "/api/auth/register", {
    body: { name: "Sam Rivera", email: "sam@example.com", password: "correct horse", workspaceName: "Rivera Labs", plan },
  });
  expect(res.status).toBe(201);
  return api;
}

async function addActiveProject() {
  await container.current.projects.create({
    id: "prj_extra",
    workspaceId: SEED_IDS.workspace,
    name: "Extra",
    description: "",
    color: "blue",
    archived: false,
    createdAt: new Date().toISOString(),
  });
}

describe("POST /api/billing/plan", () => {
  it("upgrades after the mock checkout and charges per member at the landing-page price", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const api = await createLoggedInApi();

    const res = await changePlan(api, { plan: "business", billingPeriod: "yearly", payment: TEST_CARD });

    expect(res.status).toBe(200);
    expect(res.body.subscription).toMatchObject({ plan: "business", effectivePlan: "business", billingPeriod: "yearly" });
    // Business yearly: $24 per member per month x 5 members x 12 months.
    expect(res.body.invoice).toMatchObject({ amount: 1440, status: "paid", period: "Oct 2026 – Sep 2027" });

    const invoices = await api.request<InvoicesResponse>(listInvoices, "/api/billing/invoices");
    expect(invoices.body.invoices.map((i) => i.amount)).toEqual([1440, 75, 75]);
  });

  it("switches billing period on the same plan", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const api = await createLoggedInApi();

    const res = await changePlan(api, { plan: "pro", billingPeriod: "yearly", payment: TEST_CARD });

    expect(res.status).toBe(200);
    expect(res.body.invoice).toMatchObject({ amount: 720 });
  });

  it("declines any card but the test card, and leaves the plan alone", async () => {
    const api = await createLoggedInApi();

    const res = await changePlan(api, {
      plan: "business",
      billingPeriod: "monthly",
      payment: { ...TEST_CARD, cardNumber: "4000 0000 0000 0002" },
    });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { "payment.cardNumber": [expect.stringContaining("4242")] } },
    });
    const invoices = await api.request<InvoicesResponse>(listInvoices, "/api/billing/invoices");
    expect(invoices.body.invoices).toHaveLength(2);
  });

  it("requires payment details for a paid plan", async () => {
    const api = await createLoggedInApi();

    const res = await changePlan(api, { plan: "business", billingPeriod: "monthly" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { payment: expect.any(Array) } } });
  });

  it("validates card fields", async () => {
    const api = await createLoggedInApi();

    const res = await changePlan(api, { plan: "business", billingPeriod: "monthly", payment: { cardNumber: "42", expiry: "13/30", cvc: "x" } });

    expect(res.status).toBe(400);
    expect(Object.keys((res.body as { error: { fieldErrors: object } }).error.fieldErrors).sort()).toEqual([
      "payment.cardNumber",
      "payment.cvc",
      "payment.expiry",
    ]);
  });

  it("refuses a change to the plan and period already in place", async () => {
    const api = await createLoggedInApi();

    const res = await changePlan(api, { plan: "pro", billingPeriod: "monthly", payment: TEST_CARD });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: { code: "CONFLICT" } });
  });

  it("downgrades to Free without payment or an invoice when within Free's limits", async () => {
    const api = await createLoggedInApi();

    const res = await changePlan(api, { plan: "free", billingPeriod: "monthly" });

    expect(res.status).toBe(200);
    expect(res.body.invoice).toBeNull();
    expect(res.body.subscription).toMatchObject({ plan: "free", effectivePlan: "free", limits: { maxActiveProjects: 3 } });
  });

  it("blocks a downgrade while over the target plan's project limit", async () => {
    const api = await createLoggedInApi();
    await addActiveProject();

    const res = await changePlan(api, { plan: "free", billingPeriod: "monthly" });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: { code: "CONFLICT", message: expect.stringMatching(/4 active projects.*3/) } });
  });

  it("counts pending invites against the target plan's member limit", async () => {
    const api = await createLoggedInApi();
    expect((await api.request(invite, "/api/workspace/invites", { body: { email: "new@example.com" } })).status).toBe(201);

    const res = await changePlan(api, { plan: "free", billingPeriod: "monthly" });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: { code: "CONFLICT", message: expect.stringMatching(/6 members.*5/) } });
  });

  it("turns a trial into a paid plan", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const api = await registerTrial("pro");

    const res = await changePlan(api, { plan: "pro", billingPeriod: "monthly", payment: TEST_CARD });

    expect(res.status).toBe(200);
    expect(res.body.subscription).toMatchObject({ plan: "pro", trial: { endsAt: null, daysLeft: null, expired: false } });
    expect(res.body.invoice).toMatchObject({ amount: 15, period: "Oct 2026" });
  });

  it("restores a paid plan after the trial expired", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const api = await registerTrial("business");
    vi.setSystemTime(new Date("2026-11-02T12:00:00.000Z"));

    const res = await changePlan(api, { plan: "pro", billingPeriod: "monthly", payment: TEST_CARD });

    expect(res.status).toBe(200);
    expect(res.body.subscription).toMatchObject({ plan: "pro", effectivePlan: "pro", trial: { expired: false } });
  });

  it("is owner only", async () => {
    const api = await createLoggedInApi({ email: "priya@acme.studio" });

    const res = await changePlan(api, { plan: "free", billingPeriod: "monthly" });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "FORBIDDEN" } });
  });
});

describe("GET /api/billing/invoices", () => {
  it("lists the workspace's invoices, newest first", async () => {
    const api = await createLoggedInApi();

    const res = await api.request<InvoicesResponse>(listInvoices, "/api/billing/invoices");

    expect(res.status).toBe(200);
    expect(res.body.invoices.map((i) => [i.id, i.amount, i.status])).toEqual([
      ["inv_002", 75, "paid"],
      ["inv_001", 75, "paid"],
    ]);
  });

  it("is owner only", async () => {
    const api = await createLoggedInApi({ email: "priya@acme.studio" });

    expect((await api.request(listInvoices, "/api/billing/invoices")).status).toBe(403);
  });
});
