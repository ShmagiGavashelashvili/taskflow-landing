import { plans } from "@/data";
import { PLAN_LIMITS } from "@/lib/plans";
import type { PlanOffer } from "@/lib/schemas/billing";
import { PLAN_IDS, type BillingPeriod, type PlanId } from "@/lib/schemas/entities";

/**
 * The plans the app sells. Names and prices come from the landing page's `plans` (data.ts) and
 * limits from PLAN_LIMITS, so marketing and the app can't disagree.
 */
export const PLAN_OFFERS: PlanOffer[] = PLAN_IDS.map((id) => {
  const plan = plans.find((p) => p.id === id);
  if (!plan) throw new Error(`data.ts has no pricing for the "${id}" plan`);
  return { id, name: plan.name, tagline: plan.tagline, monthly: plan.monthly, yearly: plan.yearly, limits: PLAN_LIMITS[id] };
});

export function planOffer(id: PlanId): PlanOffer {
  return PLAN_OFFERS.find((offer) => offer.id === id)!;
}

/** Price per member per month for `period`. */
export function seatPrice(id: PlanId, period: BillingPeriod): number {
  const offer = planOffer(id);
  return period === "yearly" ? offer.yearly : offer.monthly;
}

/** What one billing period costs: monthly, or twelve months up front when yearly. */
export function periodTotal(id: PlanId, period: BillingPeriod, seats: number): number {
  return seatPrice(id, period) * seats * (period === "yearly" ? 12 : 1);
}
