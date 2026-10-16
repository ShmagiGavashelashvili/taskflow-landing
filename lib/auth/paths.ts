/** Where auth flows land. Shared by proxy.ts, server pages, route handlers and the auth forms. */
export const LOGIN_PATH = "/login";
export const APP_HOME = "/app";
export const REGISTER_PATH = "/register";
/** Query parameter carrying the page to return to after login. */
export const NEXT_PARAM = "next";

/**
 * `value` if it's a same-site path (starts with one `/`, no backslashes), otherwise `null`.
 * Guards the return URL against open redirects.
 */
export function safeNextPath(value: string | string[] | null | undefined): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
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
