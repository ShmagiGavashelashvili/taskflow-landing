import { describe, expect, it } from "vitest";
import { createLoggedInApi, createTestApi, setupTestContainer, type TestApi } from "@/tests/api";
import { POST as register } from "../../auth/register/route";
import { GET as listComments } from "../../tasks/[taskId]/comments/route";
import { DELETE, PATCH } from "./route";

const NOW = "2026-10-14T12:00:00.000Z";
setupTestContainer({ now: new Date(NOW) });

// Seed: on "Write homepage copy", cmt_01 is by Alex Morgan (demo owner), cmt_02 by Lena.
const OWNERS_COMMENT = "cmt_01";
const params = (commentId: string) => ({ params: { commentId } });

function edit(api: TestApi, commentId: string, body: unknown) {
  return api.request(PATCH, `/api/comments/${commentId}`, { method: "PATCH", body, ...params(commentId) });
}

function remove(api: TestApi, commentId: string) {
  return api.request(DELETE, `/api/comments/${commentId}`, { method: "DELETE", ...params(commentId) });
}

async function thread(api: TestApi) {
  const res = await api.request<Array<{ id: string; body: string }>>(listComments, "/api/tasks/tsk_website_03/comments", {
    params: { taskId: "tsk_website_03" },
  });
  return res.body;
}

describe("PATCH /api/comments/:id", () => {
  it("lets the author edit their comment and marks it edited", async () => {
    const api = await createLoggedInApi();

    const res = await edit(api, OWNERS_COMMENT, { body: "Love the headline. Shorter subhead please." });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: OWNERS_COMMENT,
      body: "Love the headline. Shorter subhead please.",
      author: { id: "usr_demo", name: "Alex Morgan" },
      editedAt: NOW,
    });
    expect((await thread(api))[0].body).toBe("Love the headline. Shorter subhead please.");
  });

  it("is forbidden for anyone but the author, even the workspace owner", async () => {
    const member = await createLoggedInApi({ email: "priya@acme.studio" });
    const owner = await createLoggedInApi();

    const byMember = await edit(member, OWNERS_COMMENT, { body: "Hijacked" });
    const byOwner = await edit(owner, "cmt_02", { body: "Hijacked" });

    expect(byMember.status).toBe(403);
    expect(byMember.body).toMatchObject({ error: { code: "FORBIDDEN", message: "Only the author can edit a comment." } });
    expect(byOwner.status).toBe(403);
    expect((await thread(owner)).map((c) => c.body)).not.toContain("Hijacked");
  });

  it("rejects an empty body", async () => {
    const res = await edit(await createLoggedInApi(), OWNERS_COMMENT, { body: "" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { fieldErrors: { body: ["Write something first."] } } });
  });

  it("is 404 for unknown comments and other workspaces' comments, and needs a session", async () => {
    const outsider = createTestApi();
    await outsider.request(register, "/api/auth/register", {
      body: { name: "Sam", email: "sam@other.co", password: "password123", workspaceName: "Other Co" },
    });

    expect((await edit(await createLoggedInApi(), "nope", { body: "Hi" })).status).toBe(404);
    expect((await edit(outsider, OWNERS_COMMENT, { body: "Hi" })).status).toBe(404);
    expect((await edit(createTestApi(), OWNERS_COMMENT, { body: "Hi" })).status).toBe(401);
  });
});

describe("DELETE /api/comments/:id", () => {
  it("lets the author delete their comment", async () => {
    const api = await createLoggedInApi();

    const res = await remove(api, OWNERS_COMMENT);

    expect(res.status).toBe(204);
    expect((await thread(api)).map((c) => c.id)).toEqual(["cmt_02"]);
  });

  it("is forbidden for anyone but the author", async () => {
    const api = await createLoggedInApi({ email: "tom@acme.studio" });

    const res = await remove(api, OWNERS_COMMENT);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: "FORBIDDEN", message: "Only the author can delete a comment." } });
    expect(await thread(api)).toHaveLength(2);
  });
});
