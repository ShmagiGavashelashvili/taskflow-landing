import { afterEach, describe, expect, it, vi } from "vitest";
import type { SessionResponse } from "@/lib/schemas/auth";
import type { MembersResponse, PendingInvite } from "@/lib/schemas/workspace";
import { SEED_PASSWORD } from "@/server/seed";
import { createLoggedInApi, createTestApi, setupTestContainer, type TestApi } from "@/tests/api";
import { POST as register } from "../../auth/register/route";
import { GET as getSession } from "../../auth/session/route";
import { DELETE as removeMember } from "../../workspace/members/[userId]/route";
import { GET as listMembers } from "../../workspace/members/route";
import { DELETE as revokeInvite } from "../../workspace/invites/[inviteId]/route";
import { POST as createInvite } from "../../workspace/invites/route";
import { POST as accept } from "./accept/route";
import { GET } from "./route";

setupTestContainer();
afterEach(() => vi.useRealTimers());

async function invite(owner: TestApi, email: string) {
  const res = await owner.request<{ invite: PendingInvite }>(createInvite, "/api/workspace/invites", { body: { email } });
  expect(res.status).toBe(201);
  const token = res.body.invite.inviteUrl.replace("/invite/", "");
  return { ...res.body.invite, token };
}

const lookUp = (api: TestApi, token: string) => api.request(GET, `/api/invites/${token}`, { params: { token } });
const acceptAs = (api: TestApi, token: string, body: unknown) =>
  api.request<SessionResponse>(accept, `/api/invites/${token}/accept`, { body, params: { token } });
const joinAsNewUser = (api: TestApi, token: string) => acceptAs(api, token, { mode: "register", name: "Jo Park", password: "correct horse" });

async function registerWorkspace(email: string, plan: "free" | "pro" = "pro") {
  const api = createTestApi();
  const res = await api.request(register, "/api/auth/register", {
    body: { name: "Sam Rivera", email, password: "correct horse", workspaceName: "Rivera Labs", plan },
  });
  expect(res.status).toBe(201);
  return api;
}

describe("GET /api/invites/:token", () => {
  it("describes a valid invite to anyone holding the link", async () => {
    const { token, expiresAt } = await invite(await createLoggedInApi(), "jo@example.com");

    const res = await lookUp(createTestApi(), token);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      email: "jo@example.com",
      workspaceName: "Acme Studio",
      invitedByName: "Alex Morgan",
      expiresAt,
      accountExists: false,
    });
  });

  it("says whether the invited email already has an account", async () => {
    await registerWorkspace("sam@example.com");
    const { token } = await invite(await createLoggedInApi(), "sam@example.com");

    expect((await lookUp(createTestApi(), token)).body).toMatchObject({ accountExists: true });
  });

  it("explains why an invite can't be used: unknown, revoked, used or expired", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const owner = await createLoggedInApi();
    const revoked = await invite(owner, "revoked@example.com");
    await owner.request(revokeInvite, "/api/workspace/invites/x", { method: "DELETE", params: { inviteId: revoked.id } });
    const used = await invite(owner, "used@example.com");
    await joinAsNewUser(createTestApi(), used.token);
    const expired = await invite(owner, "expired@example.com");
    vi.setSystemTime(new Date("2026-10-23T12:00:00.000Z"));

    const cases = [
      ["not-a-real-token", /isn't valid/],
      [revoked.token, /revoked/],
      [used.token, /already been used/],
      [expired.token, /expired/],
    ] as const;
    for (const [token, message] of cases) {
      const res = await lookUp(createTestApi(), token);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: { code: "INVALID_TOKEN", message: expect.stringMatching(message) } });
    }
  });
});

describe("POST /api/invites/:token/accept", () => {
  it("registers a new account as a member and logs it into the workspace", async () => {
    const owner = await createLoggedInApi();
    const { token } = await invite(owner, "jo@example.com");
    const jo = createTestApi();

    const res = await joinAsNewUser(jo, token);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      user: { name: "Jo Park", email: "jo@example.com" },
      workspace: { id: "ws_acme" },
      role: "member",
    });
    expect((await jo.request(getSession, "/api/auth/session")).body).toMatchObject({ workspace: { id: "ws_acme" }, role: "member" });
    const members = await owner.request<MembersResponse>(listMembers, "/api/workspace/members");
    expect(members.body.members.at(-1)).toMatchObject({ email: "jo@example.com", role: "member" });
  });

  it("works only once", async () => {
    const { token } = await invite(await createLoggedInApi(), "jo@example.com");
    await joinAsNewUser(createTestApi(), token);

    const again = await acceptAs(createTestApi(), token, { mode: "login", password: "correct horse" });

    expect(again.status).toBe(400);
    expect(again.body).toMatchObject({ error: { code: "INVALID_TOKEN" } });
  });

  it("rejects an expired invite", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const { token } = await invite(await createLoggedInApi(), "jo@example.com");

    vi.setSystemTime(new Date("2026-10-23T12:00:01.000Z"));
    const res = await joinAsNewUser(createTestApi(), token);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "INVALID_TOKEN", message: expect.stringMatching(/expired/) } });
  });

  it("rejects a revoked invite", async () => {
    const owner = await createLoggedInApi();
    const { id, token } = await invite(owner, "jo@example.com");
    await owner.request(revokeInvite, "/api/workspace/invites/x", { method: "DELETE", params: { inviteId: id } });

    expect((await joinAsNewUser(createTestApi(), token)).status).toBe(400);
  });

  it("validates the registration fields", async () => {
    const { token } = await invite(await createLoggedInApi(), "jo@example.com");

    const res = await acceptAs(createTestApi(), token, { mode: "register", name: "", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { name: [expect.any(String)], password: [expect.any(String)] } },
    });
  });

  it("asks an existing account to log in instead of registering", async () => {
    await registerWorkspace("sam@example.com");
    const { token } = await invite(await createLoggedInApi(), "sam@example.com");

    const res = await joinAsNewUser(createTestApi(), token);

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: { code: "EMAIL_TAKEN" } });
  });

  it("lets a former member log in to rejoin", async () => {
    const owner = await createLoggedInApi();
    await owner.request(removeMember, "/api/workspace/members/usr_priya", { method: "DELETE", params: { userId: "usr_priya" } });
    const { token } = await invite(owner, "priya@acme.studio");
    const priya = createTestApi();

    const wrong = await acceptAs(priya, token, { mode: "login", password: "not-it" });
    const res = await acceptAs(priya, token, { mode: "login", password: SEED_PASSWORD });

    expect(wrong.status).toBe(401);
    expect(wrong.body).toMatchObject({ error: { code: "INVALID_CREDENTIALS", fieldErrors: { password: [expect.any(String)] } } });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ user: { id: "usr_priya" }, workspace: { id: "ws_acme" }, role: "member" });
  });

  it("asks someone without an account to register instead of logging in", async () => {
    const { token } = await invite(await createLoggedInApi(), "jo@example.com");

    const res = await acceptAs(createTestApi(), token, { mode: "login", password: "whatever" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: { code: "INVALID_CREDENTIALS" } });
  });

  it("refuses accounts that already belong to another workspace (one workspace per account for now)", async () => {
    await registerWorkspace("sam@example.com");
    const { token } = await invite(await createLoggedInApi(), "sam@example.com");

    const res = await acceptAs(createTestApi(), token, { mode: "login", password: "correct horse" });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: { code: "CONFLICT" } });
  });

  it("is blocked when the workspace is full under Free limits after its trial expired", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const owner = await registerWorkspace("sam@example.com"); // Pro trial ends Oct 30
    vi.setSystemTime(new Date("2026-10-25T12:00:00.000Z"));
    const invites = [];
    for (const name of ["a", "b", "c", "d", "e"]) invites.push(await invite(owner, `${name}@example.com`));
    for (const { token } of invites.slice(0, 4)) expect((await joinAsNewUser(createTestApi(), token)).status).toBe(200);

    vi.setSystemTime(new Date("2026-10-31T12:00:00.000Z"));
    const res = await joinAsNewUser(createTestApi(), invites[4].token);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "PLAN_LIMIT_REACHED" } });
  });
});
