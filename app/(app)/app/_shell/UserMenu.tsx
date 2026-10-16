"use client";

import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authApi } from "@/lib/api/auth";
import { LOGIN_PATH, LOGOUT_PATH } from "@/lib/auth/paths";
import { initialsOf } from "@/lib/people";

interface UserMenuProps {
  name: string;
  email: string;
}

/** Sidebar footer: who's signed in, a profile link and logout. */
export default function UserMenu({ name, email }: UserMenuProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function logOut() {
    setLoggingOut(true);
    try {
      await authApi.logout();
      // A full navigation drops every client cache (router, TanStack Query) of the old session.
      window.location.assign(LOGIN_PATH);
    } catch {
      setLoggingOut(false);
      toast.error("Couldn't log out. Please try again.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none hover:bg-tint/60 focus-visible:ring-[3px] focus-visible:ring-brand/20">
        <Avatar initials={initialsOf(name)} size="lg" className="ring-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Account menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings/profile">
            <UserRound aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={loggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void logOut();
          }}
        >
          <LogOut aria-hidden="true" />
          {loggingOut ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-2" aria-hidden="true">
      <div className="size-8 rounded-full bg-tint" />
      <div className="grid flex-1 gap-1">
        <div className="h-3.5 w-24 rounded bg-tint" />
        <div className="h-3 w-32 rounded bg-tint" />
      </div>
    </div>
  );
}

/**
 * Shown when the signed-in user can't be loaded. Logging out still works: GET /api/auth/logout
 * clears the cookie and goes to login without needing the store.
 */
export function UserMenuUnavailable() {
  return (
    <a
      href={LOGOUT_PATH}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-tint/60 hover:text-ink"
    >
      <LogOut className="size-4" aria-hidden="true" />
      Log out
    </a>
  );
}
