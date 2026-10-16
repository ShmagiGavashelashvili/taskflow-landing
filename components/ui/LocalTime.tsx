"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

const LOCAL = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const UTC = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

/**
 * A timestamp in the reader's time zone. The server doesn't know that zone, so the server
 * render (and hydration) shows just the UTC date, and the browser then fills in local time.
 */
export default function LocalTime({ iso, className }: { iso: string; className?: string }) {
  const inBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  const date = new Date(iso);
  return (
    <time dateTime={iso} className={className}>
      {inBrowser ? LOCAL.format(date) : UTC.format(date)}
    </time>
  );
}
