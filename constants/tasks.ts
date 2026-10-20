import type { TaskPriority, TaskStatus } from "@/lib/schemas/entities";
import { BAR_TONE_CLASSES } from "./tones";

/** Dashboard bar fill per task status. */
export const STATUS_BAR_CLASSES: Record<TaskStatus, string> = {
  todo: BAR_TONE_CLASSES.slate,
  in_progress: BAR_TONE_CLASSES.blue,
  in_review: BAR_TONE_CLASSES.amber,
  done: BAR_TONE_CLASSES.teal,
};

/** Priority badge colours on task cards and rows. */
export const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-rose-50 text-rose-700",
};
