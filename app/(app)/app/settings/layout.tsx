import { Suspense } from "react";
import { getAppSession } from "@/server/auth/app-session";
import { withFallback } from "@/server/render";
import { NavLinks, StaticNavLinks } from "../_shell/NavLinks";
import { settingsNavFor } from "./nav";

/** Settings: a section nav (from SETTINGS_NAV, filtered by role) beside the current section's page. */
export default function SettingsLayout({ children }: LayoutProps<"/app/settings">) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Settings</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[12rem_1fr] md:gap-10">
        <Suspense fallback={<StaticNavLinks items={settingsNavFor("member")} label="Settings" />}>
          <SettingsNav />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

async function SettingsNav() {
  // If the session can't be read, show the sections every member sees.
  const session = await withFallback(getAppSession, null);
  const items = settingsNavFor(session?.role ?? "member");
  return (
    <Suspense fallback={<StaticNavLinks items={items} label="Settings" />}>
      <NavLinks items={items} label="Settings" />
    </Suspense>
  );
}
