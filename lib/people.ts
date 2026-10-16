import type { AvatarTone } from "@/types";

/** Up to two initials: first and last name. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase() || "?";
}

/** A stable avatar colour per user id, so a person looks the same everywhere. */
export function avatarToneOf(userId: string): AvatarTone {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return (Math.abs(hash) % 5) as AvatarTone;
}
