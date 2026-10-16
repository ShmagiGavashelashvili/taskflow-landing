import { updateProfileRequestSchema } from "@/lib/schemas/auth";
import type { User } from "@/lib/schemas/entities";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { meService } from "@/server/services/me";

export const GET = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  return json<User>(await meService(container).getProfile(session));
});

export const PATCH = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  const patch = await parseBody(request, updateProfileRequestSchema);
  return json<User>(await meService(container).updateProfile(session, patch));
});
