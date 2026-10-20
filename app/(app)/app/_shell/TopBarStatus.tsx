import { Clock3, FlaskConical } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { plans } from "@/data";
import { trialDaysLeft } from "@/lib/trial";
import type { AppSession } from "@/server/auth/session";
import { isDemoMode } from "@/server/config";
import { getContainer } from "@/server/container";
import { BILLING_PATH } from "@/lib/app-paths";

/** Right side of the top bar: the demo badge and the trial countdown. Rendered inside Suspense. */
export default function TopBarStatus({ session }: { session: AppSession }) {
  // Read after the session (a request-time read), so the current time is allowed here.
  const daysLeft = trialDaysLeft(session.workspace.trialEndsAt, getContainer().clock.now());
  const planName = plans.find((plan) => plan.id === session.workspace.plan)?.name ?? session.workspace.plan;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isDemoMode() && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          Demo environment: data may reset
        </span>
      )}
      {daysLeft !== null && daysLeft > 0 && (
        // Owners can act on the countdown, so it links to billing for them.
        <TrialBadge href={session.role === "owner" ? BILLING_PATH : undefined}>
          <Clock3 className="size-3.5" aria-hidden="true" />
          {planName} trial: {daysLeft} {daysLeft === 1 ? "day" : "days"} left
        </TrialBadge>
      )}
    </div>
  );
}

function TrialBadge({ href, children }: { href?: string; children: ReactNode }) {
  const className = "inline-flex items-center gap-1.5 rounded-full bg-tint px-2.5 py-1 text-xs font-semibold text-brand";
  if (!href) return <span className={className}>{children}</span>;
  return (
    <Link href={href} className={`${className} hover:underline`}>
      {children}
    </Link>
  );
}
