import "server-only";
import { isDomainError } from "@/server/domain/errors";

export type Gated<T> = { locked: false; data: T } | { locked: true; message: string };

/**
 * For pages that render a plan-gated service call: resolves `PLAN_LIMIT_REACHED` to
 * `{ locked: true, message }` (shown as an upgrade prompt) and rethrows anything else.
 */
export async function gated<T>(promise: Promise<T>): Promise<Gated<T>> {
  try {
    return { locked: false, data: await promise };
  } catch (error) {
    if (isDomainError(error, "PLAN_LIMIT_REACHED")) return { locked: true, message: error.message };
    throw error;
  }
}
