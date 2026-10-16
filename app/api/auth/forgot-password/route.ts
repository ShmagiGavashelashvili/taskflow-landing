import { forgotPasswordRequestSchema, type ForgotPasswordResponse } from "@/lib/schemas/auth";
import { isDemoMode } from "@/server/config";
import { json, parseBody, route } from "@/server/http/handler";
import { authService } from "@/server/services/auth";

/**
 * Issues a reset link. Outside demo mode the response is always `{ resetUrl: null }`, so it never
 * reveals whether the email has an account (a real backend emails the link instead). Demo mode
 * returns the link for display, because the prototype sends no email.
 */
export const POST = route(async (request, { container }) => {
  const input = await parseBody(request, forgotPasswordRequestSchema);
  const resetUrl = await authService(container).forgotPassword(input);
  return json<ForgotPasswordResponse>({ resetUrl: isDemoMode() ? resetUrl : null });
});
