import "server-only";
import { unstable_rethrow } from "next/navigation";

/**
 * For Server Components that decorate a page (the app shell, the landing navbar's account
 * links): runs `render` and, if it fails, logs the error and returns `fallback` so the rest
 * of the page still renders. Next's own control flow (redirect, notFound, prerender bail-outs)
 * passes through untouched.
 *
 * ```tsx
 * const session = await withFallback(getOptionalAppSession, null);
 * ```
 */
export async function withFallback<T>(render: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await render();
  } catch (error) {
    unstable_rethrow(error);
    console.error(error);
    return fallback;
  }
}
