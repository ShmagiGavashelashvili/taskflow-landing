import { changePasswordRequestSchema } from "@/lib/schemas/auth";
import { requireSession } from "@/server/auth/session";
import { noContent, parseBody, route } from "@/server/http/handler";
import { meService } from "@/server/services/me";

/** Changes the password after checking the current one. The current session stays valid. */
export const POST = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  const input = await parseBody(request, changePasswordRequestSchema);
  await meService(container).changePassword(session, input);
  return noContent();
});
