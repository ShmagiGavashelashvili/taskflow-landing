import type { BillingOption } from "@/types";

/** Percentage saved by paying yearly, shown next to the billing toggle. */
export const YEARLY_SAVINGS_PERCENT = 20;

export const BILLING_OPTIONS: BillingOption[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];
