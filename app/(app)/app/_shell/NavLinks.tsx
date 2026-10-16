"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** Highlight only on this exact path (for index routes like `/app`). Default: path prefix. */
  exact?: boolean;
}

interface NavLinksProps {
  items: readonly NavItem[];
  label: string;
  className?: string;
}

/**
 * A vertical nav list that highlights the current page. `usePathname` suspends under dynamic
 * segments, so render this inside `<Suspense fallback={<StaticNavLinks ... />}>`.
 */
export function NavLinks({ items, label, className }: NavLinksProps) {
  const pathname = usePathname();
  return <NavList items={items} label={label} className={className} isActive={(item) => matches(item, pathname)} />;
}

/** The same list without highlighting, for Suspense fallbacks. */
export function StaticNavLinks({ items, label, className }: NavLinksProps) {
  return <NavList items={items} label={label} className={className} isActive={() => false} />;
}

function matches(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavList({ items, label, className, isActive }: NavLinksProps & { isActive: (item: NavItem) => boolean }) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="grid gap-0.5">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-tint text-brand" : "text-muted-foreground hover:bg-tint/60 hover:text-ink",
                )}
              >
                {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
