/**
 * Calendar-week maths on `YYYY-MM-DD` dates (UTC, the calendar the API uses for due dates).
 * Weeks start on Monday. Shared by the dashboard's "this week", the timeline API and its grid.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** `date` moved by `days` (negative goes back). */
export function addDays(date: string, days: number): string {
  return new Date(toUtc(date).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** The Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const daysSinceMonday = (toUtc(date).getUTCDay() + 6) % 7;
  return addDays(date, -daysSinceMonday);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / DAY_MS);
}
