"use client";

import { automationsApi } from "@/lib/api/billing";
import type { AutomationsResponse } from "@/lib/schemas/integrations";
import FeatureToggleList from "../FeatureToggleList";

/** Enable/disable toggles for the preset automation rules. */
export default function AutomationsList({ automations, available, isOwner }: AutomationsResponse & { isOwner: boolean }) {
  return (
    <FeatureToggleList
      feature="Automations"
      items={automations.map(({ id, name, description, enabled }) => ({ id, name, description, on: enabled }))}
      available={available}
      isOwner={isOwner}
      onLabel="Enabled"
      offLabel="Disabled"
      save={automationsApi.set}
    />
  );
}
