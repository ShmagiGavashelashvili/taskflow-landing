"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { createContext, use, useCallback, useState, type ReactNode } from "react";
import { navLinks } from "@/data";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useScrolled } from "@/hooks/useScrolled";
import { APP_HOME, LOGIN_PATH, REGISTER_PATH } from "@/lib/auth/paths";
import { buttonClass } from "@/lib/ui";
import Logo from "./ui/Logo";

const NAV_LINK_CLASS =
  "rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink motion-reduce:transition-none";

/** Where the account links render: the desktop bar or the mobile menu (which closes on navigate). */
interface AccountSlot {
  mobile: boolean;
  onNavigate?: () => void;
}

const AccountSlotContext = createContext<AccountSlot>({ mobile: false });

/**
 * Log in and Start Free Trial for visitors, Go to app for a signed-in user. Rendered in the
 * Navbar's `account` slot, so a server component can decide `signedIn` behind Suspense.
 */
export function AccountLinks({ signedIn }: { signedIn: boolean }) {
  const { mobile, onNavigate } = use(AccountSlotContext);
  const size = mobile ? "lg" : "md";

  if (signedIn) {
    return (
      <Link href={APP_HOME} onClick={onNavigate} className={buttonClass("primary", size)}>
        Go to app
      </Link>
    );
  }

  return (
    <>
      <Link
        href={LOGIN_PATH}
        onClick={onNavigate}
        className={mobile ? buttonClass("secondary", "lg") : `${NAV_LINK_CLASS} text-ink`}
      >
        Log in
      </Link>
      <Link href={REGISTER_PATH} onClick={onNavigate} className={buttonClass("primary", size)}>
        Start Free Trial
      </Link>
    </>
  );
}

interface NavbarProps {
  /** Account links, rendered in both the desktop bar and the mobile menu. Logged-out links by default. */
  account?: ReactNode;
}

export default function Navbar({ account = <AccountLinks signedIn={false} /> }: NavbarProps) {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);

  useEscapeKey(open, closeMenu);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 motion-reduce:transition-none ${
        scrolled || open
          ? "border-line bg-bg/80 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" aria-label="TaskFlow home" className="rounded-lg">
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">{account}</div>

        <button
          type="button"
          className="-mr-2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </nav>

      {open ? (
        <div id="mobile-menu" className="border-t border-line px-5 pt-3 pb-6 md:hidden">
          <ul className="flex flex-col">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 text-base font-semibold text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3">
            <AccountSlotContext value={{ mobile: true, onNavigate: closeMenu }}>{account}</AccountSlotContext>
          </div>
        </div>
      ) : null}
    </header>
  );
}
