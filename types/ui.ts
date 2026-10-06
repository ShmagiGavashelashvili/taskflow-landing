/** Accent colour of a mockup badge or bar. */
export type Tone = "blue" | "teal" | "amber" | "violet" | "rose" | "slate";

/** Index into the avatar gradient palette. */
export type AvatarTone = 0 | 1 | 2 | 3 | 4;

export interface Person {
  initials: string;
  tone: AvatarTone;
}
