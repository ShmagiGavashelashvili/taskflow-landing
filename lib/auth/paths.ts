/** Where auth flows land. Shared by proxy.ts, server pages, route handlers and the auth forms. */
export const LOGIN_PATH = "/login";
export const APP_HOME = "/app";
export const REGISTER_PATH = "/register";
/** Query parameter carrying the page to return to after login. */
export const NEXT_PARAM = "next";
/** Logs out and redirects to login (see app/api/auth/logout/route.ts). */
export const LOGOUT_PATH = "/api/auth/logout";
/** Request header proxy.ts sets on app requests: the page path and query, for server pages. */
export const APP_PATH_HEADER = "x-taskflow-app-path";

/**
 * `value` if it's a same-site path (starts with one `/`, no backslashes), otherwise `null`.
 * Guards the return URL against open redirects.
 */
export function safeNextPath(value: string | string[] | null | undefined): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

/** `value` if it's a safe path inside the app (`/app` or below), otherwise `null`. */
export function safeAppPath(value: string | null | undefined): string | null {
  const safe = safeNextPath(value);
  if (!safe) return null;
  const pathname = safe.split(/[?#]/, 1)[0];
  return pathname === APP_HOME || pathname.startsWith(`${APP_HOME}/`) ? safe : null;
}

/**
 * Where a server page sends a stale session: logout clears the cookie and goes to login, which
 * returns to `appPath` afterwards if it's a safe app page.
 */
export function staleSessionUrl(appPath: string | null | undefined): string {
  const safe = safeAppPath(appPath);
  return safe ? `${LOGOUT_PATH}?${new URLSearchParams({ [NEXT_PARAM]: safe })}` : LOGOUT_PATH;
}

/** `/login`, with `?next=` when there is a safe page to return to. */
export function loginUrl(next?: string | null): string {
  const safe = safeNextPath(next);
  return safe ? `${LOGIN_PATH}?${new URLSearchParams({ [NEXT_PARAM]: safe })}` : LOGIN_PATH;
}

/** `/register`, pre-filling the email and/or plan (read by the register page). */
export function registerUrl(prefill: { email?: string; plan?: string } = {}): string {
  const query = new URLSearchParams();
  if (prefill.email) query.set("email", prefill.email);
  if (prefill.plan) query.set("plan", prefill.plan);
  const search = query.toString();
  return search ? `${REGISTER_PATH}?${search}` : REGISTER_PATH;
}
