import { CalendarRange, FolderKanban, LayoutDashboard, Settings } from "lucide-react";
import type { NavItem } from "./NavLinks";

/**
 * The sidebar's main navigation, in display order. Add an entry when a section ships, e.g.
 * `{ href: "/app/timeline", label: "Timeline", icon: CalendarRange }` (#7).
 * Projects are listed separately by SidebarProjects. Rendered by MainNav (a client module).
 */
export const APP_NAV: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/projects", label: "Projects", icon: FolderKanban, exact: true },
  { href: "/app/timeline", label: "Timeline", icon: CalendarRange },
  { href: "/app/settings", label: "Settings", icon: Settings },
];
