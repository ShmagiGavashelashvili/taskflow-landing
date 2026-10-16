import type { NavItem } from "../_shell/NavLinks";

/**
 * Settings sections, in display order. Each ticket appends its page here:
 * Workspace and Members (#4), Billing, Integrations and Automations (#8).
 * `/app/settings` redirects to the first entry. Items are passed to a Client Component, so
 * don't add `icon`s here (components can't cross that boundary) unless you move the list
 * into a client module like _shell/MainNav.tsx.
 */
export const SETTINGS_NAV: NavItem[] = [
  { href: "/app/settings/profile", label: "Profile" },
  { href: "/app/settings/workspace", label: "Workspace" },
  { href: "/app/settings/members", label: "Members" },
];
