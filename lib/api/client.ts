import type { z } from "zod";
import { apiErrorBodySchema, type ErrorCode, type FieldErrors } from "./errors";

/** A failed API call, carrying the server's error shape. `status` is 0 for network failures. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions<S extends z.ZodType | undefined> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Serialised as JSON. */
  body?: unknown;
  /** Validates the success body; the result is typed from it. */
  schema?: S;
  signal?: AbortSignal;
}

type Result<S> = S extends z.ZodType ? z.output<S> : unknown;

/**
 * Calls the app's own `/api/*` routes from the browser. Resolves with the (schema-checked)
 * JSON body, or `undefined` for an empty response; rejects with `ApiError` otherwise.
 * Feature modules wrap this in typed functions and TanStack Query hooks.
 */
export async function apiRequest<S extends z.ZodType | undefined = undefined>(
  path: string,
  options: ApiRequestOptions<S> = {},
): Promise<Result<S>> {
  const { method = "GET", body, schema, signal } = options;

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: { accept: "application/json", ...(body !== undefined && { "content-type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, "UNAVAILABLE", "Can't reach the server. Check your connection and try again.");
  }

  const text = await response.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const parsed = apiErrorBodySchema.safeParse(data);
    if (parsed.success) {
      const { code, message, fieldErrors } = parsed.data.error;
      throw new ApiError(response.status, code, message, fieldErrors);
    }
    throw new ApiError(response.status, "INTERNAL_ERROR", "Something went wrong. Please try again.");
  }

  if (!schema) return data as Result<S>;
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(response.status, "INTERNAL_ERROR", "The server sent an unexpected response.");
  }
  return parsed.data as Result<S>;
}
