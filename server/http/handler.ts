import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { ERROR_STATUS, type ApiErrorBody, type ErrorCode, type FieldErrors } from "@/lib/api/errors";
import { endSession } from "@/server/auth/session";
import { SESSION_COOKIE } from "@/server/auth/token";
import { getContainer, type Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import { runInRequestScope } from "@/server/request-scope";

type Params = Record<string, string | string[] | undefined>;

export interface HandlerContext<P extends Params> {
  /** Resolved dynamic route params. */
  params: P;
  container: Container;
}

/**
 * Wraps a route handler: resolves params, hands over the container, and turns any thrown
 * `DomainError` into the API error shape. Anything else becomes a logged 500.
 *
 * ```ts
 * export const GET = route<{ projectId: string }>(async (request, { params, container }) => {
 *   const project = await projectService(container).get(session, params.projectId);
 *   return json(project);
 * });
 * ```
 */
export function route<P extends Params = Params>(
  handler: (request: NextRequest, context: HandlerContext<P>) => Promise<Response>,
) {
  return async (request: NextRequest, context: { params: Promise<P> }): Promise<Response> => {
    // Reading the request keeps GET handlers dynamic under Cache Components. It must happen
    // outside `try`, because the prerender bail-out works by throwing.
    request.headers.get("accept");
    try {
      const params = (await context?.params) ?? ({} as P);
      // One request scope per call, so the mock store's simulated latency applies once.
      return await runInRequestScope(() => handler(request, { params, container: getContainer() }));
    } catch (error) {
      const response = toErrorResponse(error);
      // A session cookie that no longer resolves (expired, or its user is gone) is cleared.
      const unauthenticated = error instanceof DomainError && error.code === "UNAUTHENTICATED";
      if (unauthenticated && request.cookies.has(SESSION_COOKIE)) endSession(response);
      return response;
    }
  };
}

export function json<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

/** An empty 204 response, for successful deletes and other actions with nothing to return. */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(code: ErrorCode, message: string, fieldErrors?: FieldErrors): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: fieldErrors ? { code, message, fieldErrors } : { code, message } },
    { status: ERROR_STATUS[code] },
  );
}

export function toErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof DomainError) return errorResponse(error.code, error.message, error.fieldErrors);
  console.error(error);
  return errorResponse("INTERNAL_ERROR", "Something went wrong. Please try again.");
}

/** Parses the JSON body with `schema`, throwing VALIDATION_ERROR with field errors on failure. */
export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new DomainError("VALIDATION_ERROR", "Request body must be valid JSON.");
  }
  return parseWith(schema, body);
}

/**
 * Parses query-string parameters with `schema`. Values arrive as strings (repeated keys as
 * arrays), so use `z.coerce` or string enums in the schema.
 */
export function parseQuery<S extends z.ZodType>(request: Request, schema: S): z.output<S> {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of new URL(request.url).searchParams) {
    const existing = query[key];
    query[key] = existing === undefined ? value : [...[existing].flat(), value];
  }
  return parseWith(schema, query);
}

/** Validates any value with `schema`, throwing VALIDATION_ERROR with field errors on failure. */
export function parseWith<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    if (field) (fieldErrors[field] ??= []).push(issue.message);
  }
  const hasFields = Object.keys(fieldErrors).length > 0;
  const message = hasFields ? "Please check the highlighted fields." : (result.error.issues[0]?.message ?? "Invalid request.");
  throw new DomainError("VALIDATION_ERROR", message, hasFields ? fieldErrors : undefined);
}
