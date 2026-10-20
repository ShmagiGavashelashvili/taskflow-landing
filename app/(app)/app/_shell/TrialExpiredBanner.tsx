import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { planOffer } from "@/lib/billing";
import { isTrialExpired } from "@/lib/plans";
import { getContainer } from "@/server/container";
import type { BannerProps } from "./AppBanners";
import { BILLING_PATH } from "@/lib/app-paths";

/** Shown to everyone once the workspace's trial has ended and it reads as Free. */
export default function TrialExpiredBanner({ session }: BannerProps) {
  const { workspace, role } = session;
  // Rendered after the session read, so reading the clock is allowed here.
  if (!isTrialExpired(workspace, getContainer().clock.now())) return null;
  const planName = planOffer(workspace.plan).name;

  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300/70 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
      <p className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Your {planName} trial has ended.</strong> This workspace is on the Free plan now.
          Nothing was deleted, but Free limits apply.{role === "owner" ? "" : " Ask your workspace owner to upgrade."}
        </span>
      </p>
      {role === "owner" && (
        <Link href={BILLING_PATH} className="font-semibold underline underline-offset-2 hover:no-underline">
          Choose a plan
        </Link>
      )}
    </div>
  );
}
