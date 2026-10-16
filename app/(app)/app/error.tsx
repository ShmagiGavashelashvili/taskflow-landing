"use client";

import { Button } from "@/components/ui/button";

/** Error state for any app page. The shell (sidebar, top bar) stays usable around it. */
export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
      <h1 className="text-lg font-bold text-ink">Something went wrong</h1>
      <p className="mt-1.5 text-muted-foreground">We couldn&apos;t load this page. It may be a temporary hiccup.</p>
      <Button className="mt-5" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
