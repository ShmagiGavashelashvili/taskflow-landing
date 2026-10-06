import type { AvatarTone } from "@/types";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const AVATAR_GRADIENTS = [
  "from-blue-500 to-cyan-400",
  "from-teal-500 to-emerald-400",
  "from-amber-400 to-orange-500",
  "from-violet-500 to-fuchsia-400",
  "from-rose-500 to-pink-400",
] as const;

const AVATAR_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-5 w-5 text-[8px]",
  md: "h-6 w-6 text-[9px]",
  lg: "h-8 w-8 text-[11px]",
  xl: "h-12 w-12 text-sm",
};

interface AvatarProps {
  initials: string;
  tone?: AvatarTone;
  size?: AvatarSize;
  className?: string;
}

/** Initials on a gradient circle. Decorative: the person's name is always shown next to it. */
export default function Avatar({ initials, tone = 0, size = "md", className = "" }: AvatarProps) {
  const gradient = AVATAR_GRADIENTS[tone];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ring-2 ring-white ${gradient} ${AVATAR_SIZE_CLASSES[size]} ${className}`}
    >
      {initials}
    </span>
  );
}
