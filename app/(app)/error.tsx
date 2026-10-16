"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Error state for the whole app area, including its layout (sidebar, top bar, banners). The
 * shell pieces degrade on their own (server/render.ts), so this shows only when the layout
 * itself fails. Page errors are caught closer, by app/(app)/app/error.tsx, inside the shell.
 */
export default function AppShellError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-4">
      <div role="alert" className="max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <h1 className="text-lg font-bold text-ink">Something went wrong</h1>
        <p className="mt-1.5 text-muted-foreground">We couldn&apos;t load TaskFlow. It may be a temporary hiccup.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => retry()}>Try again</Button>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-brand">
            Back to the home page
          </Link>
        </div>
      </div>
    </main>
  );
}
