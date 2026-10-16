import { describe, expect, it } from "vitest";
import type { MembersResponse } from "@/lib/schemas/workspace";
import { createLoggedInApi, createTestApi, setupTestContainer } from "@/tests/api";
import { GET as getSession } from "../../auth/session/route";
import { DELETE } from "./[userId]/route";
import { GET } from "./route";

setupTestContainer();

const MEMBER = { email: "priya@acme.studio" };

describe("GET /api/workspace/members", () => {
  it("lists members with roles and the plan's member limit, for owners and members alike", async () => {
    for (const account of [undefined, MEMBER]) {
      const api = await createLoggedInApi(account);

      const res = await api.request<MembersResponse>(GET, "/api/workspace/members");

      expect(res.status).toBe(200);
      expect(res.body.members.map((m) => [m.name, m.role])).toEqual([
        ["Alex Morgan", "owner"],
        ["Priya Shah", "member"],
        ["Marcus Chen", "member"],
        ["Lena Fischer", "member"],
        ["Tom Okafor", "member"],
      ]);
      expect(res.body.members[0]).not.toHaveProperty("passwordHash");
      expect(res.body).toMatchObject({ effectivePlan: "pro", memberLimit: null });
    }
  });

  it("requires a session", async () => {
    expect((await createTestApi().request(GET, "/api/workspace/members")).status).toBe(401);
  });
});

describe("DELETE /api/workspace/members/:userId", () => {
  const remove = (userId: string) => ({ method: "DELETE", params: { userId } });

  it("lets the owner remove a member, who loses access", async () => {
    const owner = await createLoggedInApi();
    const priya = await createLoggedInApi(MEMBER);

    const res = await owner.request(DELETE, "/api/workspace/members/usr_priya", remove("usr_priya"));

    expect(res.status).toBe(204);
    const list = await owner.request<MembersResponse>(GET, "/api/workspace/members");
    expect(list.body.members.map((m) => m.id)).not.toContain("usr_priya");
    expect((await priya.request(getSession, "/api/auth/session")).status).toBe(401);
  });

  it("forbids members from removing anyone", async () => {
    const api = await createLoggedInApi(MEMBER);

    const res = await api.request(DELETE, "/api/workspace/members/usr_tom", remove("usr_tom"));

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  it("won't let the owner remove themselves", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(DELETE, "/api/workspace/members/usr_demo", remove("usr_demo"));

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: { code: "CONFLICT" } });
  });

  it("returns 404 for someone who isn't a member", async () => {
    const api = await createLoggedInApi();

    const res = await api.request(DELETE, "/api/workspace/members/usr_nobody", remove("usr_nobody"));

    expect(res.status).toBe(404);
  });
});
