"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { BILLING_OPTIONS } from "@/constants/pricing";
import { buttonClass } from "@/lib/ui";
import type { Billing, Plan } from "@/types";
import SignupLink from "./ui/SignupLink";

interface PricingPlansProps {
  plans: Plan[];
}

/** Largest percentage saved by paying yearly, derived from the paid plans' prices. */
function yearlySavingsPercent(plans: Plan[]): number {
  const savings = plans.filter((plan) => plan.monthly > 0).map((plan) => 1 - plan.yearly / plan.monthly);
  return Math.round(Math.max(0, ...savings) * 100);
}

function AnimatedPrice({ amount }: { amount: number }) {
  return (
    <span className="relative inline-flex h-14 items-baseline overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={amount}
          initial={{ y: "70%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-70%", opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="text-5xl font-extrabold tracking-tight tabular-nums"
        >
          ${amount}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function PricingPlans({ plans }: PricingPlansProps) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const yearlySavings = yearlySavingsPercent(plans);

  return (
    <div>
      <fieldset className="mx-auto mb-12 flex w-fit items-center gap-3">
        <legend className="sr-only">Billing period</legend>
        <div className="flex gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-card">
          {BILLING_OPTIONS.map((option) => (
            <label key={option.value} className="relative cursor-pointer">
              <input
                type="radio"
                name="billing"
                value={option.value}
                checked={billing === option.value}
                onChange={() => setBilling(option.value)}
                className="peer sr-only"
              />
              <span className="block rounded-xl px-5 py-2.5 text-sm font-semibold text-muted transition-colors peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand motion-reduce:transition-none">
                {option.label}
              </span>
            </label>
          ))}
        </div>
        {yearlySavings > 0 ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
            Save {yearlySavings}%
          </span>
        ) : null}
      </fieldset>

      <ul className="mx-auto grid max-w-md gap-6 lg:max-w-none lg:grid-cols-3 lg:items-stretch">
        {plans.map((plan) => {
          const price = billing === "yearly" ? plan.yearly : plan.monthly;
          return (
            <li key={plan.id} className="relative">
              {plan.highlighted ? (
                <span className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand to-teal px-4 py-1 text-xs font-bold tracking-wide whitespace-nowrap text-white uppercase shadow-card">
                  Most Popular
                </span>
              ) : null}
              <div
                className={`flex h-full flex-col rounded-3xl border bg-white p-7 ${
                  plan.highlighted
                    ? "border-brand shadow-float ring-1 ring-brand lg:-my-3 lg:py-10"
                    : "border-line shadow-card"
                }`}
              >
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <AnimatedPrice amount={price} />
                  <span className="text-sm text-muted">{plan.monthly === 0 ? "forever" : "/user/mo"}</span>
                </div>
                <p className="mt-1 h-5 text-sm text-muted">
                  {plan.monthly === 0 ? "Free for small teams" : billing === "yearly" ? "Billed annually" : "Billed monthly"}
                </p>
                <SignupLink
                  className={`${buttonClass(plan.highlighted ? "primary" : "secondary", "lg")} mt-6 w-full`}
                >
                  {plan.cta}
                </SignupLink>
                <ul className="mt-8 space-y-3 border-t border-line pt-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
