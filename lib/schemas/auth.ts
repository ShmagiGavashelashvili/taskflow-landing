import { z } from "zod";
import { planIdSchema, roleSchema, userSchema, workspaceSchema } from "./entities";

/**
 * Request and response shapes for `/api/auth/*` and `/api/me/*`. Forms validate with the same
 * request schemas the route handlers parse with, so client and server messages match.
 */

export const MIN_PASSWORD_LENGTH = 8;

const email = z
  .string()
  .trim()
  .min(1, "Please enter your email address.")
  .pipe(z.email("That doesn't look like a valid email address."))
  .transform((value) => value.toLowerCase());

const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(200, "Password is too long.");

const requiredText = (message: string, max = 80) =>
  z.string().trim().min(1, message).max(max, `Keep it under ${max} characters.`);

export const registerRequestSchema = z.object({
  name: requiredText("Please enter your name."),
  email,
  password: newPassword,
  workspaceName: requiredText("Please name your workspace."),
  /** The plan the 14-day trial runs on. Free has no trial. */
  plan: planIdSchema.default("pro"),
});
export type RegisterRequest = z.input<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email,
  password: z.string().min(1, "Please enter your password."),
});
export type LoginRequest = z.input<typeof loginRequestSchema>;

export const forgotPasswordRequestSchema = z.object({ email });
export type ForgotPasswordRequest = z.input<typeof forgotPasswordRequestSchema>;

export const forgotPasswordResponseSchema = z.object({
  /**
   * Demo mode only: path of the reset page with its token, e.g. `/reset-password?token=...`, or
   * `null` when no account has that email. Outside demo mode it's always `null`, so the response
   * doesn't reveal which emails have accounts; a real backend emails the link.
   */
  resetUrl: z.string().nullable(),
});
export type ForgotPasswordResponse = z.infer<typeof forgotPasswordResponseSchema>;

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, "The reset link is missing its token."),
  password: newPassword,
});
export type ResetPasswordRequest = z.input<typeof resetPasswordRequestSchema>;

/** The signed-in user, their workspace and their role in it. Returned by register, login and session. */
export const sessionResponseSchema = z.object({
  user: userSchema,
  workspace: workspaceSchema,
  role: roleSchema,
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const updateProfileRequestSchema = z.object({
  name: requiredText("Please enter your name."),
});
export type UpdateProfileRequest = z.input<typeof updateProfileRequestSchema>;

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password."),
  newPassword,
});
export type ChangePasswordRequest = z.input<typeof changePasswordRequestSchema>;
