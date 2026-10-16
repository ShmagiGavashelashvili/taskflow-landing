import "server-only";
import type { ErrorCode, FieldErrors } from "@/lib/api/errors";

/** Marks DomainErrors across module copies. */
const BRAND = Symbol.for("taskflow.DomainError");

/**
 * A failure the API reports to the client. Services throw these; the handler wrapper turns
 * them into `{ error: { code, message, fieldErrors? } }` with the status for `code`.
 *
 * `instanceof` checks a brand rather than the class: Next bundles server code separately for
 * pages and route handlers, while the container (and its repositories) is shared per process,
 * so an error can come from another copy of this module.
 */
export class DomainError extends Error {
  readonly [BRAND] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return typeof value === "object" && value !== null && (value as Record<symbol, unknown>)[BRAND] === true;
  }

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
