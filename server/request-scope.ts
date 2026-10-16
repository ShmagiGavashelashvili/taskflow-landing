import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { cache } from "react";

/**
 * An identity for the request being handled, so per-request work (like the mock store's
 * simulated latency) happens once per request instead of once per call.
 *
 * - API requests: `route()` runs each handler inside `runInRequestScope`.
 * - Server renders: React's `cache` gives one scope per render.
 * - Anywhere else (scripts, tests calling repositories directly) every call gets a new scope.
 */
// On globalThis, because Next bundles this module separately for pages and route handlers while
// the container that reads the scope is shared per process (see server/container.ts).
const globalForScope = globalThis as typeof globalThis & { __taskflowRequestScope?: AsyncLocalStorage<object> };
const storage = (globalForScope.__taskflowRequestScope ??= new AsyncLocalStorage<object>());
const renderScope = cache((): object => ({}));

export function runInRequestScope<T>(fn: () => T): T {
  return storage.run({}, fn);
}

/** The current request's scope object; use it as a WeakMap key. */
export function currentRequestScope(): object {
  return storage.getStore() ?? renderScope();
}
