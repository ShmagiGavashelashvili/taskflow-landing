import "server-only";
import path from "node:path";

/**
 * Environment-driven settings, read on each call so tests can stub the environment.
 *
 * - `DEMO_MODE`: "false" turns off the demo badge and credential hint (on by default).
 * - `MOCK_LATENCY_MS`: simulated delay per repository call (default 300, 0 in tests).
 * - `MOCK_FAILURE_RATE`: probability 0..1 that a repository call fails with UNAVAILABLE (default 0).
 */

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}

export function mockLatencyMs(): number {
  return readNumber("MOCK_LATENCY_MS", process.env.NODE_ENV === "test" ? 0 : 300);
}

export function mockFailureRate(): number {
  return Math.min(1, readNumber("MOCK_FAILURE_RATE", 0));
}

/** Where the dev server keeps the mock store between restarts; none on Vercel, in builds or tests. */
export function mockPersistPath(): string | null {
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL) return null;
  return path.join(process.cwd(), ".data", "db.json");
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
