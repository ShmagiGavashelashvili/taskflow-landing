import type { z } from "zod";
import type { FieldErrors } from "@/lib/api/errors";
import { ApiError } from "@/lib/api/client";

export type FormResult<T> = { ok: true; data: T } | { ok: false; fieldErrors: FieldErrors };

/**
 * Validates form values with the same zod schema the route handler parses with, so client
 * messages match the server's. Field paths are dot-joined like the API's `fieldErrors`.
 */
export function validateForm<S extends z.ZodType>(schema: S, values: unknown): FormResult<z.output<S>> {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    (fieldErrors[field] ??= []).push(issue.message);
  }
  return { ok: false, fieldErrors };
}

/** `errors` without `field`, e.g. once the user edits it. */
export function clearFieldError(errors: FieldErrors, field: string): FieldErrors {
  if (!(field in errors)) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}

/** Splits a failed request into field errors (shown inline) and a form-level message. */
export function describeFailure(error: unknown): { fieldErrors: FieldErrors; message: string | null } {
  if (error instanceof ApiError) {
    if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
      return { fieldErrors: error.fieldErrors, message: null };
    }
    return { fieldErrors: {}, message: error.message };
  }
  return { fieldErrors: {}, message: "Something went wrong. Please try again." };
}
