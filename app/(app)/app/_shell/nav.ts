import { CalendarRange, FolderKanban, LayoutDashboard, Settings } from "lucide-react";
import { APP_HOME } from "@/lib/auth/paths";
import { PROJECTS_PATH, SETTINGS_PATH, TIMELINE_PATH } from "@/lib/app-paths";
import type { NavItem } from "./NavLinks";

/**
 * The sidebar's main navigation, in display order. Add an entry when a section ships, e.g.
 * `{ href: TIMELINE_PATH, label: "Timeline", icon: CalendarRange }` (#7).
 * Projects are listed separately by SidebarProjects. Rendered by MainNav (a client module).
 */
export const APP_NAV: NavItem[] = [
  { href: APP_HOME, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: PROJECTS_PATH, label: "Projects", icon: FolderKanban, exact: true },
  { href: TIMELINE_PATH, label: "Timeline", icon: CalendarRange },
  { href: SETTINGS_PATH, label: "Settings", icon: Settings },
];
