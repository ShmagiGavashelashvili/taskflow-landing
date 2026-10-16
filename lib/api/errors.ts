import { z } from "zod";

/** Every error code the API can return, with the HTTP status it is sent with. */
export const ERROR_STATUS = {
  /** Request body or query failed schema validation; see `fieldErrors`. */
  VALIDATION_ERROR: 400,
  /** Reset or invite token is unknown, expired, revoked or already used. */
  INVALID_TOKEN: 400,
  UNAUTHENTICATED: 401,
  /** Login failed; deliberately doesn't say whether the email exists. */
  INVALID_CREDENTIALS: 401,
  /** Role check failed, e.g. a member managing billing. */
  FORBIDDEN: 403,
  /** The workspace's effective plan doesn't allow this; the UI shows an upgrade prompt. */
  PLAN_LIMIT_REACHED: 403,
  NOT_FOUND: 404,
  /** State conflict, e.g. a downgrade while over the target plan's limits. */
  CONFLICT: 409,
  EMAIL_TAKEN: 409,
  INTERNAL_ERROR: 500,
  /** Simulated (or real) backend outage. */
  UNAVAILABLE: 503,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export const ERROR_CODES = Object.keys(ERROR_STATUS) as [ErrorCode, ...ErrorCode[]];

/** Field path (dot-joined) to messages. */
export type FieldErrors = Record<string, string[]>;

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
