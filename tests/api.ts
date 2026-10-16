/**
 * Seam A harness: call route handlers in-process with real requests against a fresh seeded
 * in-memory container. Tests assert on status, body and cookies only, never on repositories.
 *
 * ```ts
 * import { createLoggedInApi, setupTestContainer } from "@/tests/api";
 * import { GET } from "./route";
 *
 * setupTestContainer();                       // fresh seed before every test
 *
 * it("lists projects", async () => {
 *   const api = await createLoggedInApi();  // one "browser", logged in as the demo owner
 *   const res = await api.request(GET, "/api/projects?archived=false");
 *   expect(res.status).toBe(200);
 * });
 * ```
 */
import { NextRequest } from "next/server";
import { afterEach, beforeEach } from "vitest";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import type { SessionResponse } from "@/lib/schemas/auth";
import { createMemoryContainer, setContainer, type Container, type MemoryContainerOptions } from "@/server/container";
import { DEMO_ACCOUNT, SEED_PASSWORD } from "@/server/seed";

const BASE_URL = "http://localhost:3000";

type TestContainerOptions = Omit<MemoryContainerOptions, "persistPath">;

export interface TestContainer {
  /** The container the handlers currently see. */
  readonly current: Container;
  /** Swaps in a new freshly seeded container, e.g. with failures or a pinned clock. */
  reset(options?: TestContainerOptions): Container;
}

/**
 * Registers hooks that give every test a freshly seeded container with no latency, no
 * failures and no disk persistence. Pass `now` to pin the clock and the seed's dates.
 */
export function setupTestContainer(defaults: TestContainerOptions = {}): TestContainer {
  let current: Container | undefined;

  const reset = (options: TestContainerOptions = {}) => {
    current = createMemoryContainer({ latencyMs: 0, failureRate: 0, ...defaults, ...options, persistPath: null });
    setContainer(current);
    return current;
  };

  beforeEach(() => {
    reset();
  });
  afterEach(() => setContainer(undefined));

  return {
    get current() {
      if (!current) throw new Error("setupTestContainer: the container is only available inside a test");
      return current;
    },
    reset,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any route handler signature
type RouteHandler = (request: NextRequest, context: { params: Promise<any> }) => Promise<Response>;

export interface RequestOptions {
  method?: string;
  /** Sent as JSON. A string is sent as is (for malformed-body tests). */
  body?: unknown;
  headers?: Record<string, string>;
  /** Dynamic route params, e.g. `{ projectId: "prj_website" }`. */
  params?: Record<string, string | string[]>;
}

export interface TestResponse<T = unknown> {
  status: number;
  /** Parsed JSON body, or `null` when the body is empty or not JSON. */
  body: T;
  headers: Headers;
  /** Raw `Set-Cookie` headers of this response. */
  setCookies: string[];
}

export interface TestApi {
  request<T = unknown>(handler: RouteHandler, path: string, options?: RequestOptions): Promise<TestResponse<T>>;
  /** Current cookie jar values, e.g. to check a session cookie was set or cleared. */
  cookie(name: string): string | undefined;
  setCookie(name: string, value: string): void;
  clearCookies(): void;
}

/**
 * A client that behaves like one browser: it stores cookies from `Set-Cookie` responses
 * (honouring `Max-Age=0` and past `Expires` as deletion) and sends them on later requests.
 */
export function createTestApi(): TestApi {
  const jar = new Map<string, string>();

  return {
    async request<T>(handler: RouteHandler, path: string, options: RequestOptions = {}) {
      const { method = options.body === undefined ? "GET" : "POST", body, headers = {}, params = {} } = options;
      const requestHeaders = new Headers(headers);
      if (body !== undefined && !requestHeaders.has("content-type")) requestHeaders.set("content-type", "application/json");
      if (jar.size > 0 && !requestHeaders.has("cookie")) {
        requestHeaders.set("cookie", [...jar].map(([name, value]) => `${name}=${value}`).join("; "));
      }

      const request = new NextRequest(new URL(path, BASE_URL), {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
      });
      const response = await handler(request, { params: Promise.resolve(params) });

      const setCookies = response.headers.getSetCookie();
      for (const header of setCookies) storeCookie(jar, header);

      const text = await response.text();
      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }
      return { status: response.status, body: parsed as T, headers: response.headers, setCookies };
    },
    cookie: (name) => jar.get(name),
    setCookie: (name, value) => void jar.set(name, value),
    clearCookies: () => jar.clear(),
  };
}

export interface LoginAccount {
  email: string;
  /** Defaults to the shared seed password, so any seeded user works with just an email. */
  password?: string;
}

/**
 * Logs `api` in through the real login endpoint (demo owner by default) and returns the
 * session body. Throws if login fails, so a broken login shows up at the call site.
 *
 * ```ts
 * const api = createTestApi();
 * await logIn(api);                                   // Alex Morgan, owner of Acme Studio
 * await logIn(api, { email: "priya@acme.studio" });   // a seeded member
 * ```
 */
export async function logIn(api: TestApi, account: LoginAccount = DEMO_ACCOUNT): Promise<SessionResponse> {
  const res = await api.request<SessionResponse>(loginHandler, "/api/auth/login", {
    body: { email: account.email, password: account.password ?? SEED_PASSWORD },
  });
  if (res.status !== 200) throw new Error(`logIn(${account.email}) failed with ${res.status}: ${JSON.stringify(res.body)}`);
  return res.body;
}

/** A fresh browser that is already logged in. */
export async function createLoggedInApi(account?: LoginAccount): Promise<TestApi> {
  const api = createTestApi();
  await logIn(api, account);
  return api;
}

function storeCookie(jar: Map<string, string>, header: string) {
  const [pair, ...attributes] = header.split(";").map((part) => part.trim());
  const separator = pair.indexOf("=");
  const name = pair.slice(0, separator);
  const value = pair.slice(separator + 1);
  const expired = attributes.some((attribute) => {
    const [key, attrValue = ""] = attribute.split("=");
    if (key.toLowerCase() === "max-age") return Number(attrValue) <= 0;
    if (key.toLowerCase() === "expires") return new Date(attrValue).getTime() <= Date.now();
    return false;
  });
  if (expired || value === "") jar.delete(name);
  else jar.set(name, value);
}
