import type { DashboardReportsResponse } from "@/lib/schemas/dashboard";
import { requireSession } from "@/server/auth/session";
import { json, route } from "@/server/http/handler";
import { dashboardService } from "@/server/services/dashboard";

export const GET = route(async (request, { container }) => {
  const session = await requireSession(request, container);
  return json<DashboardReportsResponse>(await dashboardService(container).reports(session));
});
