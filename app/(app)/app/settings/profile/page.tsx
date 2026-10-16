import type { Metadata } from "next";
import { Suspense } from "react";
import { getAppSession } from "@/server/auth/app-session";
import SettingsSection from "../SettingsSection";
import ChangePasswordForm from "./ChangePasswordForm";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = { title: "Profile · Settings · TaskFlow" };

export default function ProfilePage() {
  return (
    <div className="grid gap-6">
      <SettingsSection title="Profile" description="How you appear to your teammates.">
        <Suspense fallback={<div className="h-32 rounded-xl bg-tint" aria-hidden="true" />}>
          <Profile />
        </Suspense>
      </SettingsSection>
      <SettingsSection title="Password" description="Use at least 8 characters. You'll stay logged in on this device.">
        <ChangePasswordForm />
      </SettingsSection>
    </div>
  );
}

async function Profile() {
  const { user } = await getAppSession();
  return <ProfileForm name={user.name} email={user.email} />;
}
