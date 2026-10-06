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
