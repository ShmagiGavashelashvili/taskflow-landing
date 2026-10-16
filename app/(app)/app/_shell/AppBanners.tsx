import type { ComponentType } from "react";
import type { AppSession } from "@/server/auth/session";
import TrialExpiredBanner from "./TrialExpiredBanner";

export type BannerProps = { session: AppSession };

/**
 * SLOT: full-width banners above every app page, in order. Each banner gets the resolved
 * session (it may be an async Server Component) and renders `null` when it doesn't apply.
 * #8 appends the expired-trial banner here.
 */
const BANNERS: ComponentType<BannerProps>[] = [TrialExpiredBanner];

/** Rendered by the app layout inside `<Suspense fallback={null}>`. */
export default function AppBanners({ session }: BannerProps) {
  if (BANNERS.length === 0) return null;
  return (
    <div className="grid">
      {BANNERS.map((Banner, index) => (
        <Banner key={index} session={session} />
      ))}
    </div>
  );
}
