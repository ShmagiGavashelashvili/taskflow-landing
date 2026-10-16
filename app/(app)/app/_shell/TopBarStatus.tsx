import { Clock3, FlaskConical } from "lucide-react";
import { plans } from "@/data";
import { trialDaysLeft } from "@/lib/trial";
import type { AppSession } from "@/server/auth/session";
import { isDemoMode } from "@/server/config";
import { getContainer } from "@/server/container";

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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-tint px-2.5 py-1 text-xs font-semibold text-brand">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {planName} trial: {daysLeft} {daysLeft === 1 ? "day" : "days"} left
        </span>
      )}
    </div>
  );
}
