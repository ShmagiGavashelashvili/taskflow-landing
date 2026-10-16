"use client";

import { integrationsApi } from "@/lib/api/billing";
import type { IntegrationsResponse } from "@/lib/schemas/integrations";
import FeatureToggleList from "../FeatureToggleList";

/** Connect/disconnect toggles for the integration catalogue. */
export default function IntegrationsList({ integrations, available, isOwner }: IntegrationsResponse & { isOwner: boolean }) {
  return (
    <FeatureToggleList
      feature="Integrations"
      items={integrations.map(({ id, name, description, connected }) => ({ id, name, description, on: connected }))}
      available={available}
      isOwner={isOwner}
      onLabel="Connected"
      offLabel="Not connected"
      save={integrationsApi.set}
    />
  );
}
