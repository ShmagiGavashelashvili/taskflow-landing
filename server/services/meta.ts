import "server-only";
import type { MetaResponse } from "@/lib/schemas/meta";
import { isDemoMode } from "@/server/config";
import type { Container } from "@/server/container";
import { DEMO_ACCOUNT } from "@/server/seed";

/** Public facts about the running prototype: demo mode, the data source, the demo login. */
export function metaService(container: Container) {
  return {
    async get(): Promise<MetaResponse> {
      const demoMode = isDemoMode();
      // Reads through the store, so this also proves the data layer is reachable.
      const demoUser = demoMode ? await container.users.findByEmail(DEMO_ACCOUNT.email) : null;
      return {
        demoMode,
        dataSource: container.dataSource,
        demoAccount: demoUser ? { ...DEMO_ACCOUNT } : null,
      };
    },
  };
}
