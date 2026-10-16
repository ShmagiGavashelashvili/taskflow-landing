import { createInviteRequestSchema, type InvitesResponse, type PendingInvite } from "@/lib/schemas/workspace";
import { requireSession } from "@/server/auth/session";
import { json, parseBody, route } from "@/server/http/handler";
import { inviteService } from "@/server/services/invites";

/** Owner only: pending invites, newest first. */
export const GET = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  return json<InvitesResponse>({ invites: await inviteService(container).list(session) });
});

/** Owner only. No email is sent; the response carries the link to share. */
export const POST = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  const input = await parseBody(request, createInviteRequestSchema);
  const invite = await inviteService(container).create(session, input);
  return json<{ invite: PendingInvite }>({ invite }, { status: 201 });
});
