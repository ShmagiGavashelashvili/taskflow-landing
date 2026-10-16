"use client";

import "./globals.css";

/** Last-resort error state when the root layout itself fails. Replaces the root layout, so it brings its own document. */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-bg px-4 font-sans antialiased">
        <title>Something went wrong · TaskFlow</title>
        <div role="alert" className="max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
          <h1 className="text-lg font-bold text-ink">Something went wrong</h1>
          <p className="mt-1.5 text-muted-foreground">TaskFlow couldn&apos;t load this page. Please try again.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Try again
            </button>
            {/* A plain link: the root layout is broken, so do a full page load. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="text-sm font-medium text-muted-foreground hover:text-brand">
              Back to the home page
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
