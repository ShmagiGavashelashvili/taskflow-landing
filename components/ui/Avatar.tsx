import { AVATAR_GRADIENTS, AVATAR_SIZE_CLASSES } from "@/constants/ui";
import type { AvatarSize } from "@/types";

interface AvatarProps {
  initials: string;
  tone?: number;
  size?: AvatarSize;
  className?: string;
}

/** Initials on a gradient circle. Decorative: the person's name is always shown next to it. */
export default function Avatar({ initials, tone = 0, size = "md", className = "" }: AvatarProps) {
  const gradient = AVATAR_GRADIENTS[tone % AVATAR_GRADIENTS.length];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ring-2 ring-white ${gradient} ${AVATAR_SIZE_CLASSES[size]} ${className}`}
    >
      {initials}
    </span>
  );
}
