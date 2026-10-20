import { describe, expect, it } from "vitest";
import { DomainError } from "./errors";
import { assertUsable, decideAcceptance, isPending } from "./invites";
import type { Invite } from "./types";

const now = new Date("2026-10-20T12:00:00.000Z");
const invite: Invite = {
  id: "inv_1",
  workspaceId: "wks_1",
  email: "new@acme.studio",
  token: "t",
  invitedBy: "usr_1",
  expiresAt: "2026-10-25T00:00:00.000Z",
  acceptedAt: null,
  revokedAt: null,
};

const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error instanceof DomainError ? error.code : "other";
  }
  return null;
};

describe("isPending / assertUsable", () => {
  it("is pending until accepted, revoked or expired", () => {
    expect(isPending(invite, now)).toBe(true);
    expect(isPending({ ...invite, acceptedAt: now.toISOString() }, now)).toBe(false);
    expect(isPending({ ...invite, revokedAt: now.toISOString() }, now)).toBe(false);
    expect(isPending({ ...invite, expiresAt: now.toISOString() }, now)).toBe(false);
  });

  it("refuses unusable invites with INVALID_TOKEN", () => {
    expect(codeOf(() => assertUsable(null, now))).toBe("INVALID_TOKEN");
    expect(codeOf(() => assertUsable({ ...invite, revokedAt: "x" }, now))).toBe("INVALID_TOKEN");
    expect(codeOf(() => assertUsable(invite, now))).toBeNull();
  });
});

describe("decideAcceptance", () => {
  it("lets a new email register and join", () => {
    expect(decideAcceptance(invite, { mode: "register", account: null })).toEqual({ kind: "join" });
  });

  it("refuses registering over an existing account", () => {
    expect(codeOf(() => decideAcceptance(invite, { mode: "register", account: { id: "u" } }))).toBe("EMAIL_TAKEN");
  });

  it("needs an account and the right password to log in", () => {
    expect(codeOf(() => decideAcceptance(invite, { mode: "login", account: null, passwordOk: false }))).toBe("INVALID_CREDENTIALS");
    expect(codeOf(() => decideAcceptance(invite, { mode: "login", account: { id: "u", memberships: [] }, passwordOk: false }))).toBe("INVALID_CREDENTIALS");
  });

  it("joins an account with no workspace", () => {
    expect(decideAcceptance(invite, { mode: "login", account: { id: "u", memberships: [] }, passwordOk: true })).toEqual({ kind: "join" });
  });

  it("rejoins with the existing role when already a member", () => {
    const memberships = [{ workspaceId: "wks_1", role: "owner" as const }];
    expect(decideAcceptance(invite, { mode: "login", account: { id: "u", memberships }, passwordOk: true })).toEqual({ kind: "rejoin", role: "owner" });
  });

  it("refuses an account that belongs to another workspace", () => {
    const memberships = [{ workspaceId: "wks_2", role: "member" as const }];
    expect(codeOf(() => decideAcceptance(invite, { mode: "login", account: { id: "u", memberships }, passwordOk: true }))).toBe("CONFLICT");
  });
});
