import { NextRequest } from "next/server";
import { getRedirectUrl, unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import { createLoggedInApi, setupTestContainer } from "@/tests/api";
import { APP_PATH_HEADER } from "@/lib/auth/paths";
import { config, proxy } from "./proxy";

setupTestContainer();

const BASE = "http://localhost:3000";

function visit(path: string, cookie?: string) {
  return proxy(new NextRequest(new URL(path, BASE), { headers: cookie ? { cookie: `tf_session=${cookie}` } : {} }));
}

async function sessionCookie() {
  return (await createLoggedInApi()).cookie("tf_session")!;
}

describe("proxy", () => {
  it("sends logged-out visitors of app pages to login with a return URL", async () => {
    const res = await visit("/app/settings/profile?tab=1");

    expect(getRedirectUrl(res)).toBe(`${BASE}/login?next=%2Fapp%2Fsettings%2Fprofile%3Ftab%3D1`);
  });

  it("treats an invalid cookie as logged out", async () => {
    expect(getRedirectUrl(await visit("/app", "garbage"))).toBe(`${BASE}/login?next=%2Fapp`);
  });

  it("lets logged-in users into the app", async () => {
    const res = await visit("/app", await sessionCookie());

    expect(getRedirectUrl(res)).toBeNull();
  });

  it("tells server pages which app page was requested, replacing any client-sent value", async () => {
    const request = new NextRequest(new URL("/app/projects/prj_website?view=list", BASE), {
      headers: { cookie: `tf_session=${await sessionCookie()}`, [APP_PATH_HEADER]: "/app/forged" },
    });

    const res = await proxy(request);

    expect(res.headers.get(`x-middleware-request-${APP_PATH_HEADER}`)).toBe("/app/projects/prj_website?view=list");
  });

  it.each(["/login", "/register"])("sends logged-in users from %s into the app", async (path) => {
    expect(getRedirectUrl(await visit(path, await sessionCookie()))).toBe(`${BASE}/app`);
  });

  it("honours a safe return URL when a logged-in user lands on login", async () => {
    const res = await visit("/login?next=%2Fapp%2Fsettings%2Fprofile", await sessionCookie());

    expect(getRedirectUrl(res)).toBe(`${BASE}/app/settings/profile`);
  });

  it("leaves auth pages alone for visitors", async () => {
    expect(getRedirectUrl(await visit("/login"))).toBeNull();
    expect(getRedirectUrl(await visit("/forgot-password"))).toBeNull();
  });

  it("only runs on app and auth pages", () => {
    for (const url of ["/app", "/app/settings/profile", "/login", "/register", "/forgot-password", "/reset-password"]) {
      expect(unstable_doesMiddlewareMatch({ config, url }), url).toBe(true);
    }
    for (const url of ["/", "/api/auth/session", "/application", "/_next/static/chunk.js"]) {
      expect(unstable_doesMiddlewareMatch({ config, url }), url).toBe(false);
    }
  });
});
