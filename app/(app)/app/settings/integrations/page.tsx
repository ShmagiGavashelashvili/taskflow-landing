import type { Metadata } from "next";
import { Suspense } from "react";
import { getAppSession } from "@/server/auth/app-session";
import { getContainer } from "@/server/container";
import { integrationService } from "@/server/services/integrations";
import SettingsSection from "../SettingsSection";
import IntegrationsList from "./IntegrationsList";

export const metadata: Metadata = { title: "Integrations · Settings · TaskFlow" };

export default function IntegrationsPage() {
  return (
    <SettingsSection title="Integrations" description="Connect the tools your team already uses. In this demo, connecting only saves the setting.">
      <Suspense fallback={<div className="h-72 rounded-xl bg-tint" aria-hidden="true" />}>
        <Integrations />
      </Suspense>
    </SettingsSection>
  );
}

async function Integrations() {
  const session = await getAppSession();
  const data = await integrationService(getContainer()).listIntegrations(session);
  return <IntegrationsList {...data} isOwner={session.role === "owner"} />;
}
