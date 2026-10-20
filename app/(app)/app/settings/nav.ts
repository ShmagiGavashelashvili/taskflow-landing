import {
  AUTOMATIONS_PATH,
  BILLING_PATH,
  INTEGRATIONS_PATH,
  MEMBERS_PATH,
  PROFILE_PATH,
  WORKSPACE_PATH,
} from "@/lib/app-paths";
import type { Role } from "@/lib/schemas/entities";
import type { NavItem } from "../_shell/NavLinks";

type SettingsNavItem = NavItem & {
  /** Hidden from members. The page and API still enforce it; this only keeps the nav honest. */
  ownerOnly?: boolean;
};

/**
 * Settings sections, in display order. Each ticket appends its page here:
 * Workspace and Members (#4), Billing, Integrations and Automations (#8).
 * `/app/settings` redirects to the first entry. Items are passed to a Client Component, so
 * don't add `icon`s here (components can't cross that boundary) unless you move the list
 * into a client module like _shell/MainNav.tsx.
 */
export const SETTINGS_NAV: SettingsNavItem[] = [
  { href: PROFILE_PATH, label: "Profile" },
  { href: WORKSPACE_PATH, label: "Workspace" },
  { href: MEMBERS_PATH, label: "Members" },
  { href: BILLING_PATH, label: "Billing", ownerOnly: true },
  { href: INTEGRATIONS_PATH, label: "Integrations" },
  { href: AUTOMATIONS_PATH, label: "Automations" },
];

/** The settings sections a role sees. */
export function settingsNavFor(role: Role): NavItem[] {
  return SETTINGS_NAV.filter((item) => role === "owner" || !item.ownerOnly).map(({ href, label }) => ({ href, label }));
}
