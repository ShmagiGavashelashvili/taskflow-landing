import "server-only";

/**
 * State shared by every copy of the server code in this process.
 *
 * Next bundles server code separately for pages and route handlers, so a module-level `const`
 * exists once per bundle, while the things that must be shared (the container, the request
 * scope, the error brand) are per process. Anything with that need goes through here, keyed on
 * `globalThis`, so the rule lives in one place and is tested once.
 */
const registry = globalThis as typeof globalThis & { __taskflow?: Map<string, unknown> };

/** The process-wide value for `key`, created with `init` on first use by any module copy. */
export function processGlobal<T>(key: string, init: () => T): T {
  const values = (registry.__taskflow ??= new Map());
  if (!values.has(key)) values.set(key, init());
  return values.get(key) as T;
}

/** Replaces the process-wide value for `key` (tests; `undefined` clears it). */
export function setProcessGlobal<T>(key: string, value: T | undefined): void {
  const values = (registry.__taskflow ??= new Map());
  if (value === undefined) values.delete(key);
  else values.set(key, value);
}
