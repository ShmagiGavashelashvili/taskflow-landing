/**
 * Seam B helpers: stub `fetch` at the network boundary so client components talk to a fake
 * API. Assert on what the user sees and on the requests sent, never on component internals.
 *
 * ```ts
 * const fetchMock = stubFetch(() => jsonResponse({ error: { code: "INVALID_CREDENTIALS", message: "..." } }, 401));
 * ...
 * expect(sentRequest(fetchMock)).toEqual({ path: "/api/auth/login", method: "POST", body: { ... } });
 * ```
 */
import { vi } from "vitest";

export type FetchHandler = (path: string, init: RequestInit) => Response | Promise<Response>;

export function stubFetch(handler: FetchHandler) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => handler(String(input), init));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export function errorResponse(status: number, code: string, message: string, fieldErrors?: Record<string, string[]>) {
  return jsonResponse({ error: fieldErrors ? { code, message, fieldErrors } : { code, message } }, status);
}

/** The `n`th request a stubbed fetch received (default: the last), with its JSON body parsed. */
export function sentRequest(fetchMock: ReturnType<typeof stubFetch>, n = -1) {
  const call = fetchMock.mock.calls.at(n);
  if (!call) throw new Error("fetch was not called");
  const [input, init = {}] = call;
  return {
    path: String(input),
    method: init.method ?? "GET",
    body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
  };
}
