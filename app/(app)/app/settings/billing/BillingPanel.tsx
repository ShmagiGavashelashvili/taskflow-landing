"use client";

import { Check, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import FormAlert from "@/components/forms/FormAlert";
import TextField from "@/components/forms/TextField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { billingApi } from "@/lib/api/billing";
import type { FieldErrors } from "@/lib/api/errors";
import { periodTotal, seatPrice } from "@/lib/billing";
import { describeFailure } from "@/lib/forms";
import { describeLimits } from "@/lib/plans";
import { TEST_CARD_NUMBER, type PlanOffer, type Subscription } from "@/lib/schemas/billing";
import { PLAN_IDS, type BillingPeriod, type Invoice, type PlanId } from "@/lib/schemas/entities";
import { cn } from "@/lib/utils";
import SettingsSection from "../SettingsSection";
import { BILLING_PERIOD_OPTIONS, PREFILLED_CARD_CVC, PREFILLED_CARD_EXPIRY } from "@/constants/billing";

interface BillingPanelProps {
  subscription: Subscription;
  plans: PlanOffer[];
  invoices: Invoice[];
}

interface Target {
  plan: PlanOffer;
  period: BillingPeriod;
}

const usd = (amount: number) => `$${amount.toLocaleString("en-US")}`;
const rank = (id: PlanId) => PLAN_IDS.indexOf(id);

/** Settings → Billing (owner only): current plan, plan picker with mock checkout, invoices. */
export default function BillingPanel({ subscription: initial, plans, invoices: initialInvoices }: BillingPanelProps) {
  const router = useRouter();
  const [subscription, setSubscription] = useState(initial);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [period, setPeriod] = useState<BillingPeriod>(initial.billingPeriod);
  const [target, setTarget] = useState<Target | null>(null);

  const planName = (id: PlanId) => plans.find((p) => p.id === id)?.name ?? id;
  const savings = Math.max(0, ...plans.filter((p) => p.monthly > 0).map((p) => Math.round((1 - p.yearly / p.monthly) * 100)));

  return (
    <div className="grid gap-6">
      <SettingsSection title="Current plan">
        <CurrentPlan subscription={subscription} planName={planName} />
      </SettingsSection>

      <SettingsSection title="Change plan" description="Prices match our pricing page and are per member per month. Payments are simulated.">
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-line bg-bg p-1">
          {BILLING_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={period === option.value}
              onClick={() => setPeriod(option.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                period === option.value ? "bg-surface text-ink shadow-card" : "text-muted-foreground hover:text-ink",
              )}
            >
              {option.label}
              {option.value === "yearly" && savings > 0 && <span className="ml-1.5 text-xs text-brand">Save {savings}%</span>}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} period={period} subscription={subscription} onChoose={() => setTarget({ plan, period })} />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Invoices" description="Mock invoices, generated when a paid plan is charged.">
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <InvoiceTable invoices={invoices} />
        )}
      </SettingsSection>

      <ChangePlanDialog
        target={target}
        seats={subscription.usage.members}
        onClose={() => setTarget(null)}
        onChanged={(next, invoice) => {
          setSubscription(next);
          if (invoice) setInvoices((current) => [invoice, ...current]);
          setTarget(null);
          toast.success(`You're now on ${planName(next.plan)}.`);
          router.refresh();
        }}
      />
    </div>
  );
}

function CurrentPlan({ subscription, planName }: { subscription: Subscription; planName: (id: PlanId) => string }) {
  const { trial, usage, limits } = subscription;
  const stored = planName(subscription.plan);
  let headline: string;
  let detail: string | null = null;
  if (trial.expired) {
    headline = `Your ${stored} trial has ended. You're on Free.`;
    detail = "Nothing was deleted. Choose a paid plan to get timeline, reports, integrations and automations back.";
  } else if (trial.daysLeft !== null) {
    headline = `${stored} trial: ${trial.daysLeft} ${trial.daysLeft === 1 ? "day" : "days"} left`;
    detail = `Your trial ends on ${formatDate(trial.endsAt!)}. Subscribe to keep ${stored} features; otherwise the workspace moves to Free.`;
  } else {
    headline = subscription.plan === "free" ? "You're on Free." : `You're on ${stored}, billed ${subscription.billingPeriod}.`;
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-base font-bold text-ink">{headline}</p>
        {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Usage label="Members" used={usage.members + usage.pendingInvites} limit={limits.maxMembers} note={usage.pendingInvites > 0 ? `incl. ${usage.pendingInvites} pending` : undefined} />
        <Usage label="Active projects" used={usage.activeProjects} limit={limits.maxActiveProjects} />
      </dl>
    </div>
  );
}

function Usage({ label, used, limit, note }: { label: string; used: number; limit: number | null; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-4 py-3">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink">
        {used} of {limit === null ? "unlimited" : limit}
        {note && <span className="font-normal text-muted-foreground"> ({note})</span>}
      </dd>
    </div>
  );
}

function PlanCard({
  plan,
  period,
  subscription,
  onChoose,
}: {
  plan: PlanOffer;
  period: BillingPeriod;
  subscription: Subscription;
  onChoose: () => void;
}) {
  const price = seatPrice(plan.id, period);
  const onTrial = subscription.trial.endsAt !== null;
  const isCurrent = !onTrial && subscription.plan === plan.id && (plan.id === "free" || subscription.billingPeriod === period);
  const reference = subscription.trial.expired ? subscription.effectivePlan : subscription.plan;

  let action: string;
  if (plan.id === reference) {
    action = onTrial ? `Subscribe to ${plan.name}` : `Switch to ${period}`;
  } else {
    action = rank(plan.id) > rank(reference) ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;
  }

  return (
    <div
      role="group"
      aria-label={plan.name}
      className={cn("flex flex-col rounded-xl border p-4", isCurrent ? "border-brand bg-tint" : "border-line bg-surface")}
    >
      <p className="text-sm font-bold text-ink">{plan.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-extrabold text-ink">{usd(price)}</span>
        <span className="text-xs text-muted-foreground">{plan.monthly === 0 ? "forever" : "/user/mo"}</span>
      </p>
      <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
        <li>{plan.limits.maxMembers === null ? "Unlimited members" : `Up to ${plan.limits.maxMembers} members`}</li>
        <li>{plan.limits.maxActiveProjects === null ? "Unlimited projects" : `${plan.limits.maxActiveProjects} active projects`}</li>
        <li>{plan.limits.features.integrations ? "Timeline, reports, integrations, automations" : "Boards only"}</li>
      </ul>
      <div className="mt-4 flex flex-1 items-end">
        {isCurrent ? (
          <Button type="button" variant="outline" className="w-full" disabled>
            <Check aria-hidden="true" />
            Current plan
          </Button>
        ) : (
          <Button type="button" variant={rank(plan.id) > rank(reference) ? "default" : "outline"} className="w-full" onClick={onChoose}>
            {action}
          </Button>
        )}
      </div>
    </div>
  );
}

const PREFILLED_CARD = { cardNumber: TEST_CARD_NUMBER, expiry: PREFILLED_CARD_EXPIRY, cvc: PREFILLED_CARD_CVC };

function ChangePlanDialog({
  target,
  seats,
  onClose,
  onChanged,
}: {
  target: Target | null;
  seats: number;
  onClose: () => void;
  onChanged: (subscription: Subscription, invoice: Invoice | null) => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {target && <ChangePlanForm key={`${target.plan.id}-${target.period}`} target={target} seats={seats} onClose={onClose} onChanged={onChanged} />}
      </DialogContent>
    </Dialog>
  );
}

function ChangePlanForm({
  target,
  seats,
  onClose,
  onChanged,
}: {
  target: Target;
  seats: number;
  onClose: () => void;
  onChanged: (subscription: Subscription, invoice: Invoice | null) => void;
}) {
  const [card, setCard] = useState(PREFILLED_CARD);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { plan, period } = target;
  const total = periodTotal(plan.id, period, seats);
  const paid = total > 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await billingApi.changePlan({ plan: plan.id, billingPeriod: period, ...(paid && { payment: card }) });
      onChanged(result.subscription, result.invoice);
    } catch (error) {
      const failure = describeFailure(error);
      setFieldErrors(failure.fieldErrors);
      setMessage(failure.message ?? failure.fieldErrors.payment?.[0] ?? null);
      setSubmitting(false);
    }
  }

  const field = (name: keyof typeof card) => ({
    value: card[name],
    errors: fieldErrors[`payment.${name}`],
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setCard((current) => ({ ...current, [name]: e.target.value }));
      setFieldErrors({});
    },
  });

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{paid ? `Checkout: ${plan.name}, billed ${period}` : `Switch to ${plan.name}?`}</DialogTitle>
        <DialogDescription>
          {paid
            ? "This is a mock checkout. No card is charged; only the test card is accepted."
            : `${plan.name} allows ${describeLimits(plan.limits)}. Nothing is deleted.`}
        </DialogDescription>
      </DialogHeader>

      {paid && (
        <>
          <div className="flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {usd(seatPrice(plan.id, period))} × {seats} {seats === 1 ? "member" : "members"}
              {period === "yearly" ? " × 12 months" : ""}
            </span>
            <span className="text-base font-bold text-ink">{usd(total)}</span>
          </div>
          <TextField label="Card number" inputMode="numeric" autoComplete="cc-number" {...field("cardNumber")} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Expiry (MM/YY)" autoComplete="cc-exp" {...field("expiry")} />
            <TextField label="CVC" inputMode="numeric" autoComplete="cc-csc" {...field("cvc")} />
          </div>
        </>
      )}

      {message && <FormAlert>{message}</FormAlert>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {paid && <CreditCard aria-hidden="true" />}
          {submitting ? "Processing…" : paid ? `Pay ${usd(total)}` : `Switch to ${plan.name}`}
        </Button>
      </DialogFooter>
    </form>
  );
}

function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="overflow-x-auto">
      <table aria-label="Invoices" className="w-full text-left text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="pb-2 font-semibold">Period</th>
            <th scope="col" className="pb-2 font-semibold">Issued</th>
            <th scope="col" className="pb-2 text-right font-semibold">Amount</th>
            <th scope="col" className="pb-2 text-right font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="py-2.5 font-medium text-ink">{invoice.period}</td>
              <td className="py-2.5 text-muted-foreground">{formatDate(invoice.issuedAt)}</td>
              <td className="py-2.5 text-right font-semibold text-ink tabular-nums">{usd(invoice.amount)}</td>
              <td className="py-2.5 text-right">
                <span className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-semibold text-muted-foreground capitalize">{invoice.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
