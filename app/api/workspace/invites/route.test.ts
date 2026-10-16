import { afterEach, describe, expect, it, vi } from "vitest";
import type { InvitesResponse, MembersResponse, PendingInvite } from "@/lib/schemas/workspace";
import { createLoggedInApi, createTestApi, setupTestContainer, type TestApi } from "@/tests/api";
import { POST as register } from "../../auth/register/route";
import { GET as listMembers } from "../members/route";
import { DELETE } from "./[inviteId]/route";
import { GET, POST } from "./route";

setupTestContainer();
afterEach(() => vi.useRealTimers());

const MEMBER = { email: "priya@acme.studio" };

async function invite(api: TestApi, email: string) {
  return api.request<{ invite: PendingInvite }>(POST, "/api/workspace/invites", { body: { email } });
}

async function registerWorkspace(plan: "free" | "pro") {
  const api = createTestApi();
  const res = await api.request(register, "/api/auth/register", {
    body: { name: "Sam Rivera", email: "sam@example.com", password: "correct horse", workspaceName: "Rivera Labs", plan },
  });
  expect(res.status).toBe(201);
  return api;
}

describe("POST /api/workspace/invites", () => {
  it("creates a pending invite with a shareable link valid for 7 days", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const api = await createLoggedInApi();

    const res = await invite(api, "  Jo@Example.com ");

    expect(res.status).toBe(201);
    expect(res.body.invite).toMatchObject({
      email: "jo@example.com",
      invitedBy: "usr_demo",
      expiresAt: "2026-10-23T12:00:00.000Z",
      inviteUrl: expect.stringMatching(/^\/invite\/[\w-]{20,}$/),
    });
    const list = await api.request<InvitesResponse>(GET, "/api/workspace/invites");
    expect(list.body.invites).toEqual([res.body.invite]);
  });

  it("uses a different random token for every invite", async () => {
    const api = await createLoggedInApi();

    const a = await invite(api, "a@example.com");
    const b = await invite(api, "b@example.com");

    expect(a.body.invite.inviteUrl).not.toBe(b.body.invite.inviteUrl);
  });

  it("forbids members from inviting", async () => {
    const api = await createLoggedInApi(MEMBER);

    const res = await invite(api, "jo@example.com");

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  it("rejects an invalid email", async () => {
    const res = await invite(await createLoggedInApi(), "jo@");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { email: [expect.any(String)] } } });
  });

  it("rejects someone who is already a member, or already invited", async () => {
    const api = await createLoggedInApi();
    await invite(api, "jo@example.com");

    const member = await invite(api, "PRIYA@acme.studio");
    const again = await invite(api, "jo@example.com");

    expect(member.status).toBe(409);
    expect(member.body).toMatchObject({ error: { code: "CONFLICT", fieldErrors: { email: [expect.stringMatching(/already a member/)] } } });
    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({ error: { code: "CONFLICT", fieldErrors: { email: [expect.stringMatching(/already invited/)] } } });
  });

  it("stops a Free workspace at 5 members, counting pending invites", async () => {
    const api = await registerWorkspace("free");
    for (const name of ["a", "b", "c", "d"]) expect((await invite(api, `${name}@example.com`)).status).toBe(201);

    const res = await invite(api, "e@example.com");

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "PLAN_LIMIT_REACHED", message: expect.stringMatching(/5 members/) } });
    const members = await api.request<MembersResponse>(listMembers, "/api/workspace/members");
    expect(members.body).toMatchObject({ effectivePlan: "free", memberLimit: 5 });
  });

  it("frees a seat when an invite is revoked", async () => {
    const api = await registerWorkspace("free");
    const invites = [];
    for (const name of ["a", "b", "c", "d"]) invites.push((await invite(api, `${name}@example.com`)).body.invite);

    await api.request(DELETE, "/api/workspace/invites/x", { method: "DELETE", params: { inviteId: invites[0].id } });

    expect((await invite(api, "e@example.com")).status).toBe(201);
  });

  it("applies Free limits once a Pro trial has expired", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const api = await registerWorkspace("pro"); // trial ends Oct 30
    vi.setSystemTime(new Date("2026-10-25T12:00:00.000Z"));
    for (const name of ["a", "b", "c", "d", "e"]) expect((await invite(api, `${name}@example.com`)).status).toBe(201);

    vi.setSystemTime(new Date("2026-10-31T12:00:00.000Z"));
    const res = await invite(api, "f@example.com");

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "PLAN_LIMIT_REACHED" } });
    const members = await api.request<MembersResponse>(listMembers, "/api/workspace/members");
    expect(members.body).toMatchObject({ effectivePlan: "free", memberLimit: 5 });
  });

  it("has no member limit on a paid Pro plan", async () => {
    const api = await createLoggedInApi();

    for (const name of ["a", "b", "c"]) expect((await invite(api, `${name}@example.com`)).status).toBe(201);
  });
});

describe("GET /api/workspace/invites", () => {
  it("hides expired and revoked invites", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
    const api = await createLoggedInApi();
    const old = (await invite(api, "old@example.com")).body.invite;
    vi.setSystemTime(new Date("2026-10-20T12:00:00.000Z"));
    const revoked = (await invite(api, "revoked@example.com")).body.invite;
    const fresh = (await invite(api, "fresh@example.com")).body.invite;
    await api.request(DELETE, "/api/workspace/invites/x", { method: "DELETE", params: { inviteId: revoked.id } });

    vi.setSystemTime(new Date("2026-10-23T12:00:00.000Z"));
    const res = await api.request<InvitesResponse>(GET, "/api/workspace/invites");

    expect(res.body.invites.map((i) => i.email)).toEqual([fresh.email]);
    expect(res.body.invites.map((i) => i.id)).not.toContain(old.id);
  });

  it("is owner only, since invites carry join links", async () => {
    const res = await (await createLoggedInApi(MEMBER)).request(GET, "/api/workspace/invites");

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/workspace/invites/:inviteId", () => {
  it("revokes a pending invite", async () => {
    const api = await createLoggedInApi();
    const created = (await invite(api, "jo@example.com")).body.invite;

    const res = await api.request(DELETE, "/api/workspace/invites/x", { method: "DELETE", params: { inviteId: created.id } });

    expect(res.status).toBe(204);
    expect((await api.request<InvitesResponse>(GET, "/api/workspace/invites")).body.invites).toEqual([]);
  });

  it("is owner only", async () => {
    const created = (await invite(await createLoggedInApi(), "jo@example.com")).body.invite;

    const res = await (await createLoggedInApi(MEMBER)).request(DELETE, "/api/workspace/invites/x", {
      method: "DELETE",
      params: { inviteId: created.id },
    });

    expect(res.status).toBe(403);
  });

  it("returns 404 for an unknown or already revoked invite", async () => {
    const api = await createLoggedInApi();
    const created = (await invite(api, "jo@example.com")).body.invite;
    const revoke = () => api.request(DELETE, "/api/workspace/invites/x", { method: "DELETE", params: { inviteId: created.id } });
    await revoke();

    expect((await revoke()).status).toBe(404);
    expect((await api.request(DELETE, "/api/workspace/invites/x", { method: "DELETE", params: { inviteId: "inv_nope" } })).status).toBe(404);
  });
});
