import { DAY_MS } from "./weeks";

/**
 * Whole days left in a trial, rounding a partial day up. `null` when there's no trial, `0`
 * once it has ended (the workspace then reads as Free).
 */
export function trialDaysLeft(trialEndsAt: string | null, now: Date): number | null {
  if (trialEndsAt === null) return null;
  const remaining = new Date(trialEndsAt).getTime() - now.getTime();
  return remaining <= 0 ? 0 : Math.ceil(remaining / DAY_MS);
}
