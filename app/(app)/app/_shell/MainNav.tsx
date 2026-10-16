"use client";

import { APP_NAV } from "./nav";
import { NavLinks, StaticNavLinks } from "./NavLinks";

// A client module, because APP_NAV holds icon components, which can't be passed from a Server Component.

export function MainNav() {
  return <NavLinks items={APP_NAV} label="Main" />;
}

export function MainNavFallback() {
  return <StaticNavLinks items={APP_NAV} label="Main" />;
}
