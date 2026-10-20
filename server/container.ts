import "server-only";
import { databaseConnectionString, mockFailureRate, mockLatencyMs, mockPersistPath } from "@/server/config";
import { createMemoryRepositories } from "@/server/repositories/memory/repositories";
import { withSimulatedNetwork } from "@/server/repositories/memory/simulate";
import { MemoryStore } from "@/server/repositories/memory/store";
import { processGlobal, setProcessGlobal } from "@/server/process-global";
import type { Repositories } from "@/server/repositories/types";
import { createSeedData } from "@/server/seed";
import { Database } from "@/server/repositories/postgres/database";
import { createPostgresRepositories } from "@/server/repositories/postgres/repositories";

/** Source of the current time. Services must use this instead of `new Date()` so tests can pin it. */
export interface Clock {
  now(): Date;
}

export interface Container extends Repositories {
  clock: Clock;
  /** Which implementation backs the repositories; reported by `/api/meta`. */
  dataSource: "memory" | "postgres";
}

export interface MemoryContainerOptions {
  /** Pins the clock (and the seed's relative dates) to this instant. Defaults to the real time. */
  now?: Date;
  latencyMs?: number;
  failureRate?: number;
  /** JSON file to load from and save to; `null` keeps everything in memory. */
  persistPath?: string | null;
}

/** A container backed by a freshly seeded in-memory store. */
export function createMemoryContainer(options: MemoryContainerOptions = {}): Container {
  const { now, latencyMs = 0, failureRate = 0, persistPath = null } = options;
  const clock: Clock = now ? { now: () => new Date(now) } : { now: () => new Date() };
  const store = new MemoryStore(() => createSeedData(clock.now()), persistPath);
  const repositories = withSimulatedNetwork(createMemoryRepositories(store), { latencyMs, failureRate });
  return { ...repositories, clock, dataSource: "memory" };
}

/** A container backed by Postgres. The schema and the demo seed are created on first use. */
export function createPostgresContainer(connectionString: string, now?: Date): Container {
  const clock: Clock = now ? { now: () => new Date(now) } : { now: () => new Date() };
  const database = new Database(connectionString, () => createSeedData(clock.now()));
  return { ...createPostgresRepositories(database), clock, dataSource: "postgres" };
}

/**
 * THE swap point. Chooses the repository implementations for the running environment:
 * Postgres when `DATABASE_URL` is set (Vercel production and previews), otherwise the seeded
 * in-memory store (local development and tests), without touching services, handlers, client or UI.
 */
function createContainer(): Container {
  const databaseUrl = databaseConnectionString();
  if (databaseUrl) return createPostgresContainer(databaseUrl);
  return createMemoryContainer({
    latencyMs: mockLatencyMs(),
    failureRate: mockFailureRate(),
    persistPath: mockPersistPath(),
  });
}

// Process-wide, so dev-server hot reloads and Next's separate bundles share one store.
const CONTAINER_KEY = "container";

/** The container for the current process, created (and seeded) on first access. */
export function getContainer(): Container {
  return processGlobal(CONTAINER_KEY, createContainer);
}

/** Replaces the process container; tests use this to start from a fresh seed. */
export function setContainer(container: Container | undefined): void {
  setProcessGlobal(CONTAINER_KEY, container);
}
