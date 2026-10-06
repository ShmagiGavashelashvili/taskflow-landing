import type { Tone } from "@/types";

export interface TimelineRow {
  name: string;
  tone: Tone;
  /** 1-based start column and exclusive end column on the 14-day grid. */
  start: number;
  end: number;
  progress: number;
}

export const TIMELINE_DAYS = 14;
export const TIMELINE_DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "F", "S", "S"];

export const TIMELINE_ROWS: TimelineRow[] = [
  { name: "Research", tone: "rose", start: 1, end: 5, progress: 100 },
  { name: "Wireframes", tone: "blue", start: 3, end: 8, progress: 85 },
  { name: "Visual design", tone: "violet", start: 5, end: 11, progress: 55 },
  { name: "Build", tone: "teal", start: 7, end: 14, progress: 30 },
  { name: "Content", tone: "amber", start: 8, end: 13, progress: 20 },
  { name: "Launch", tone: "slate", start: 12, end: 15, progress: 0 },
];
