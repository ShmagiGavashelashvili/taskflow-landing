import type { Metadata } from "next";
import { Suspense } from "react";
import { canOpen } from "@/lib/access";
import { BILLING_PATH } from "@/lib/app-paths";
import { getAppSession } from "@/server/auth/app-session";
import { getContainer } from "@/server/container";
import { billingService } from "@/server/services/billing";
import SettingsSection from "../SettingsSection";
import BillingPanel from "./BillingPanel";
import { pageTitle } from "@/lib/page-title";

export const metadata: Metadata = { title: pageTitle("Billing", "Settings") };

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-tint" aria-hidden="true" />}>
      <Billing />
    </Suspense>
  );
}

async function Billing() {
  const session = await getAppSession();
  if (!canOpen(session.role, BILLING_PATH)) {
    return (
      <SettingsSection title="Billing">
        <p className="text-sm text-muted-foreground">Only the workspace owner can see and change billing. Ask them if you need a different plan.</p>
      </SettingsSection>
    );
  }
  const billing = billingService(getContainer());
  const [{ subscription, plans }, invoices] = await Promise.all([billing.get(session), billing.invoices(session)]);
  return <BillingPanel subscription={subscription} plans={plans} invoices={invoices} />;
}
