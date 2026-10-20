import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import Logo from "@/components/ui/Logo";
import QueryProvider from "@/context/QueryProvider";
import { getAppSession } from "@/server/auth/app-session";
import { withFallback } from "@/server/render";
import AppBanners from "./_shell/AppBanners";
import { MainNav, MainNavFallback } from "./_shell/MainNav";
import SidebarProjects, { SidebarProjectsSkeleton, SidebarProjectsUnavailable } from "./_shell/SidebarProjects";
import TopBarStatus from "./_shell/TopBarStatus";
import UserMenu, { UserMenuSkeleton, UserMenuUnavailable } from "./_shell/UserMenu";
import { SITE_NAME } from "@/constants/site";

export const metadata: Metadata = { title: SITE_NAME, robots: { index: false } };

/**
 * The protected app shell. The chrome is static (prerendered); everything that reads the
 * session sits in its own Suspense boundary, so `{children}` never waits on it.
 * proxy.ts redirects logged-out visitors before this renders; getAppSession() catches stale sessions.
 * Each session-reading piece degrades on its own (`withFallback`) if the store fails, so the page
 * and its own error state stay reachable; app/(app)/error.tsx catches anything else here.
 */
export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-bg md:flex-row">
        <aside className="flex shrink-0 flex-col gap-5 border-b border-line bg-surface p-3 md:sticky md:top-0 md:h-screen md:w-64 md:border-r md:border-b-0">
          <div className="flex items-center justify-between gap-2 px-1.5 pt-1">
            <Link href="/app" className="rounded-lg" aria-label="TaskFlow dashboard">
              <Logo />
            </Link>
          </div>
          <Suspense fallback={<div className="mx-2.5 h-4 w-28 rounded bg-tint" aria-hidden="true" />}>
            <WorkspaceName />
          </Suspense>
          <Suspense fallback={<MainNavFallback />}>
            <MainNav />
          </Suspense>
          <div className="hidden min-h-0 flex-1 overflow-y-auto md:block">
            <Suspense fallback={<SidebarProjectsSkeleton />}>
              <Projects />
            </Suspense>
          </div>
          <div className="border-t border-line pt-2">
            <Suspense fallback={<UserMenuSkeleton />}>
              <CurrentUserMenu />
            </Suspense>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-14 items-center justify-end border-b border-line bg-surface/80 px-4 py-2 backdrop-blur md:px-8">
            <Suspense fallback={null}>
              <Status />
            </Suspense>
          </header>
          <Suspense fallback={null}>
            <Banners />
          </Suspense>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </QueryProvider>
  );
}

async function WorkspaceName() {
  const workspace = await withFallback(async () => (await getAppSession()).workspace, null);
  if (!workspace) return null;
  return (
    <p className="truncate px-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{workspace.name}</p>
  );
}

async function Projects() {
  const session = await withFallback(getAppSession, null);
  return session ? <SidebarProjects session={session} /> : <SidebarProjectsUnavailable />;
}

async function CurrentUserMenu() {
  const session = await withFallback(getAppSession, null);
  return session ? <UserMenu name={session.user.name} email={session.user.email} /> : <UserMenuUnavailable />;
}

async function Status() {
  const session = await withFallback(getAppSession, null);
  return session && <TopBarStatus session={session} />;
}

async function Banners() {
  const session = await withFallback(getAppSession, null);
  return session && <AppBanners session={session} />;
}
