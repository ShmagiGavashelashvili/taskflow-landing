import type { MetaResponse } from "@/lib/schemas/meta";
import { isDemoMode } from "@/server/config";
import { json, route } from "@/server/http/handler";
import { DEMO_ACCOUNT } from "@/server/seed";

export const GET = route(async (_request, { container }) => {
  const demoMode = isDemoMode();
  // Reads through the store, so this also proves the data layer is reachable.
  const demoUser = demoMode ? await container.users.findByEmail(DEMO_ACCOUNT.email) : null;
  return json<MetaResponse>({
    demoMode,
    dataSource: container.dataSource,
    demoAccount: demoUser ? { ...DEMO_ACCOUNT } : null,
  });
});
