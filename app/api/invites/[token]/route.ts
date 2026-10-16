import type { InvitePreview } from "@/lib/schemas/workspace";
import { json, route } from "@/server/http/handler";
import { inviteService } from "@/server/services/invites";

/** Public: describes a usable invite, or INVALID_TOKEN saying why it can't be used. */
export const GET = route<{ token: string }>(async (_request, { params, container }) => {
  return json<InvitePreview>(await inviteService(container).preview(params.token));
});
