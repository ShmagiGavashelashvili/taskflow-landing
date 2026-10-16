import type { InvoicesResponse } from "@/lib/schemas/billing";
import { requireSession } from "@/server/auth/session";
import { json, route } from "@/server/http/handler";
import { billingService } from "@/server/services/billing";

/** Owner only. Newest first. */
export const GET = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  return json<InvoicesResponse>({ invoices: await billingService(container).invoices(session) });
});
