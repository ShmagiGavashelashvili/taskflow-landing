import "server-only";
import { DomainError } from "@/server/domain/errors";
import type { Repositories } from "@/server/repositories/types";

export interface SimulationOptions {
  /** Delay added to every repository call. */
  latencyMs: number;
  /** Probability 0..1 that a call fails with UNAVAILABLE instead of running. */
  failureRate: number;
  random?: () => number;
}

/**
 * Wraps every repository method with simulated latency and failures, so the UI's loading and
 * error states can be exercised against the mock store. A no-op when both are zero.
 */
export function withSimulatedNetwork(repositories: Repositories, options: SimulationOptions): Repositories {
  const { latencyMs, failureRate, random = Math.random } = options;
  if (latencyMs <= 0 && failureRate <= 0) return repositories;

  const wrap = <T extends object>(repository: T): T =>
    Object.fromEntries(
      Object.entries(repository).map(([name, method]) => [
        name,
        async (...args: unknown[]) => {
          if (latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, latencyMs));
          if (failureRate > 0 && random() < failureRate) {
            throw new DomainError("UNAVAILABLE", "The service is temporarily unavailable. Please try again.");
          }
          return (method as (...a: unknown[]) => unknown)(...args);
        },
      ]),
    ) as T;

  return Object.fromEntries(
    Object.entries(repositories).map(([name, repository]) => [name, wrap(repository)]),
  ) as unknown as Repositories;
}
