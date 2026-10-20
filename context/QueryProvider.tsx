"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api/client";
import { QUERY_MAX_RETRIES, QUERY_STALE_TIME_MS } from "@/constants/query";

interface QueryProviderProps {
  children: ReactNode;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server-rendered data seeds the cache; don't refetch it straight after hydration.
        staleTime: QUERY_STALE_TIME_MS,
        // A 4xx won't change on retry; only retry outages and network failures.
        retry: (failureCount, error) =>
          failureCount < QUERY_MAX_RETRIES && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
    },
  });
}

/** TanStack Query for the app area. One client per mounted provider (per request on the server). */
export default function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
