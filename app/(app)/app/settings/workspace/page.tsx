import type { Metadata } from "next";
import { Suspense } from "react";
import { getAppSession } from "@/server/auth/app-session";
import SettingsSection from "../SettingsSection";
import WorkspaceForm from "./WorkspaceForm";
import { pageTitle } from "@/lib/page-title";

export const metadata: Metadata = { title: pageTitle("Workspace", "Settings") };

export default function WorkspacePage() {
  return (
    <SettingsSection title="Workspace" description="The name your team sees in the sidebar and on invites.">
      <Suspense fallback={<div className="h-24 rounded-xl bg-tint" aria-hidden="true" />}>
        <Workspace />
      </Suspense>
    </SettingsSection>
  );
}

async function Workspace() {
  const { workspace, role } = await getAppSession();
  return <WorkspaceForm name={workspace.name} canEdit={role === "owner"} />;
}
