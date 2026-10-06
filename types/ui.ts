import type { LucideIcon } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "light";
export type ButtonSize = "md" | "lg";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export type Tone = "blue" | "teal" | "amber" | "violet" | "rose" | "slate";

/** Index into the avatar gradient palette. */
export type AvatarTone = 0 | 1 | 2 | 3 | 4;

export interface Person {
  initials: string;
  tone: AvatarTone;
}

export interface BoardCard {
  title: string;
  tag: string;
  tagTone: Tone;
  due: string;
  people: Person[];
  progress?: number;
  done?: boolean;
}

export interface BoardColumn {
  name: string;
  dot: string;
  cards: BoardCard[];
}

export interface SidebarItem {
  icon: LucideIcon;
  active?: boolean;
}

export interface TimelineRow {
  name: string;
  tone: Tone;
  /** 1-based start column and exclusive end column on the 14-day grid. */
  start: number;
  end: number;
  progress: number;
}

export interface VelocityPoint {
  week: string;
  value: number;
}

export interface Kpi {
  label: string;
  value: string;
  delta: string;
}
