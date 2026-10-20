/** How long server-rendered data seeds the client cache before it counts as stale. */
export const QUERY_STALE_TIME_MS = 30_000;

/** Retries for outages and network failures; a 4xx is never retried. */
export const QUERY_MAX_RETRIES = 2;
