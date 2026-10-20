import "server-only";
import path from "node:path";

/**
 * Environment-driven settings, read on each call so tests can stub the environment.
 *
 * - `DEMO_MODE`: "true" or "false" forces the demo badge, credential hint and on-screen reset
 *   link on or off. Defaults to on in a demo environment (see `isDemoEnvironment`), off otherwise.
 * - `MOCK_LATENCY_MS`: simulated delay once per request (default 300 in a demo environment, 0
 *   otherwise and in tests).
 * - `MOCK_FAILURE_RATE`: probability 0..1 that a request fails with UNAVAILABLE (default 0).
 * - `SESSION_SECRET`: HS256 key for session cookies. Required in production; dev and tests use a fixed fallback.
 */

const DEV_SESSION_SECRET = "taskflow-dev-only-session-secret-never-use-in-production";

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production, e.g. to the output of `openssl rand -base64 32`.");
  }
  return DEV_SESSION_SECRET;
}

/**
 * Development (and tests), and Vercel preview or development deployments. Not Vercel
 * production, and not a local production server (`npm start`). Seeded demo accounts work
 * everywhere; this only picks the defaults for the demo-facing settings below.
 */
function isDemoEnvironment(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv !== "production";
  return process.env.NODE_ENV !== "production";
}

export function isDemoMode(): boolean {
  const raw = process.env.DEMO_MODE?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return isDemoEnvironment();
}

export function mockLatencyMs(): number {
  const fallback = process.env.NODE_ENV !== "test" && isDemoEnvironment() ? 300 : 0;
  return readNumber("MOCK_LATENCY_MS", fallback);
}

export function mockFailureRate(): number {
  return Math.min(1, readNumber("MOCK_FAILURE_RATE", 0));
}

/** Postgres connection string (the pooled one the Neon integration provides); unset means the in-memory store. */
export function databaseConnectionString(): string | null {
  return process.env.DATABASE_URL?.trim() || null;
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
