import type { BillingPeriod } from "@/lib/schemas/entities";

/** The monthly/yearly switch on the pricing page and in Settings → Billing. */
export const BILLING_PERIOD_OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

/** Prefilled mock-checkout details; the card number is the test card the API accepts. */
export const PREFILLED_CARD_EXPIRY = "12/34";
export const PREFILLED_CARD_CVC = "123";
