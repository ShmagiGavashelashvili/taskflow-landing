type ButtonVariant = "primary" | "secondary" | "light";
type ButtonSize = "md" | "lg";

const BUTTON_BASE_CLASS =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none";

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_6px_16px_-6px_rgb(27_77_219/0.7)] hover:bg-brand-strong",
  secondary: "border border-line bg-surface text-ink shadow-card hover:bg-tint",
  light: "bg-white text-brand-strong shadow-card hover:bg-tint focus-visible:outline-white",
};

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = "",
): string {
  return `${BUTTON_BASE_CLASS} ${BUTTON_VARIANT_CLASSES[variant]} ${BUTTON_SIZE_CLASSES[size]} ${extra}`.trim();
}
