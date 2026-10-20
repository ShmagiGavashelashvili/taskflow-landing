import type { Metadata } from "next";
import { Suspense } from "react";
import { getAppSession } from "@/server/auth/app-session";
import { getContainer } from "@/server/container";
import { integrationService } from "@/server/services/integrations";
import SettingsSection from "../SettingsSection";
import AutomationsList from "./AutomationsList";
import { pageTitle } from "@/lib/page-title";

export const metadata: Metadata = { title: pageTitle("Automations", "Settings") };

export default function AutomationsPage() {
  return (
    <SettingsSection title="Automations" description="Preset rules that save your team clicks. In this demo, enabling a rule only saves the setting.">
      <Suspense fallback={<div className="h-56 rounded-xl bg-tint" aria-hidden="true" />}>
        <Automations />
      </Suspense>
    </SettingsSection>
  );
}

async function Automations() {
  const session = await getAppSession();
  const data = await integrationService(getContainer()).listAutomations(session);
  return <AutomationsList {...data} isOwner={session.role === "owner"} />;
}
