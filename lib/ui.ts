import { BUTTON_BASE_CLASS, BUTTON_SIZE_CLASSES, BUTTON_VARIANT_CLASSES } from "@/constants/ui";
import type { ButtonSize, ButtonVariant } from "@/types";

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = "",
): string {
  return `${BUTTON_BASE_CLASS} ${BUTTON_VARIANT_CLASSES[variant]} ${BUTTON_SIZE_CLASSES[size]} ${extra}`.trim();
}
