import type { AvatarSize, ButtonSize, ButtonVariant, Tone } from "@/types";

export const NAV_LINK_CLASS =
  "rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink motion-reduce:transition-none";

export const BUTTON_BASE_CLASS =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none";

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_6px_16px_-6px_rgb(27_77_219/0.7)] hover:bg-brand-strong",
  secondary: "border border-line bg-surface text-ink shadow-card hover:bg-tint",
  light: "bg-white text-brand-strong shadow-card hover:bg-tint focus-visible:outline-white",
};

export const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const AVATAR_GRADIENTS = [
  "from-blue-500 to-cyan-400",
  "from-teal-500 to-emerald-400",
  "from-amber-400 to-orange-500",
  "from-violet-500 to-fuchsia-400",
  "from-rose-500 to-pink-400",
] as const;

export const AVATAR_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-5 w-5 text-[8px]",
  md: "h-6 w-6 text-[9px]",
  lg: "h-8 w-8 text-[11px]",
  xl: "h-12 w-12 text-sm",
};

export const BADGE_TONE_CLASSES: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700",
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-600",
};

export const BAR_TONE_CLASSES: Record<Tone, string> = {
  blue: "bg-blue-500",
  teal: "bg-teal-500",
  amber: "bg-amber-400",
  violet: "bg-violet-500",
  rose: "bg-rose-400",
  slate: "bg-slate-400",
};
