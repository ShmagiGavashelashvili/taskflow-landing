import "server-only";
import { mockFailureRate, mockLatencyMs, mockPersistPath } from "@/server/config";
import { createMemoryRepositories } from "@/server/repositories/memory/repositories";
import { withSimulatedNetwork } from "@/server/repositories/memory/simulate";
import { MemoryStore } from "@/server/repositories/memory/store";
import type { Repositories } from "@/server/repositories/types";
import { createSeedData } from "@/server/seed";

/** Source of the current time. Services must use this instead of `new Date()` so tests can pin it. */
export interface Clock {
  now(): Date;
}

export interface Container extends Repositories {
  clock: Clock;
  /** Which implementation backs the repositories; reported by `/api/meta`. */
  dataSource: "memory";
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

/**
 * THE swap point. Chooses the repository implementations for the running environment.
 * Today that's always the seeded in-memory store; a database would be selected here (for
 * example when `DATABASE_URL` is set) without touching services, handlers, client or UI.
 */
function createContainer(): Container {
  return createMemoryContainer({
    latencyMs: mockLatencyMs(),
    failureRate: mockFailureRate(),
    persistPath: mockPersistPath(),
  });
}

// Kept on globalThis so dev-server hot reloads don't reset the store.
const globalForContainer = globalThis as typeof globalThis & { __taskflowContainer?: Container };

/** The container for the current process, created (and seeded) on first access. */
export function getContainer(): Container {
  return (globalForContainer.__taskflowContainer ??= createContainer());
}

/** Replaces the process container; tests use this to start from a fresh seed. */
export function setContainer(container: Container | undefined): void {
  globalForContainer.__taskflowContainer = container;
}
