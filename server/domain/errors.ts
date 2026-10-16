import "server-only";
import type { ErrorCode, FieldErrors } from "@/lib/api/errors";

/**
 * A failure the API reports to the client. Services throw these; the handler wrapper turns
 * them into `{ error: { code, message, fieldErrors? } }` with the status for `code`.
 */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
