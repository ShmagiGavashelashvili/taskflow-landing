import { forgotPasswordRequestSchema, type ForgotPasswordResponse } from "@/lib/schemas/auth";
import { json, parseBody, route } from "@/server/http/handler";
import { authService } from "@/server/services/auth";

/** Issues a reset link. The prototype returns it for display; a real backend would email it. */
export const POST = route(async (request, { container }) => {
  const input = await parseBody(request, forgotPasswordRequestSchema);
  const resetUrl = await authService(container).forgotPassword(input);
  return json<ForgotPasswordResponse>({ resetUrl });
});
