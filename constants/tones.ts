import type { Tone } from "@/types";

/** Bar fill per mockup tone, shared by the progress bar and the timeline. */
export const BAR_TONE_CLASSES: Record<Tone, string> = {
  blue: "bg-blue-500",
  teal: "bg-teal-500",
  amber: "bg-amber-400",
  violet: "bg-violet-500",
  rose: "bg-rose-400",
  slate: "bg-slate-400",
};

/** Soft badge colours per mockup tone. */
export const BADGE_TONE_CLASSES: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700",
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-600",
};
