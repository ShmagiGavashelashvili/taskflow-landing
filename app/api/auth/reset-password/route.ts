import { resetPasswordRequestSchema } from "@/lib/schemas/auth";
import { noContent, parseBody, route } from "@/server/http/handler";
import { authService } from "@/server/services/auth";

/** Sets a new password with a single-use, one-hour reset token. Doesn't log in. */
export const POST = route(async (request, { container }) => {
  const input = await parseBody(request, resetPasswordRequestSchema);
  await authService(container).resetPassword(input);
  return noContent();
});
