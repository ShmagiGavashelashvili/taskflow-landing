"use client";

import { Menu, X } from "lucide-react";
import { useCallback, useState } from "react";
import { NAV_LINK_CLASS } from "@/constants/ui";
import { navLinks } from "@/data";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useScrolled } from "@/hooks/useScrolled";
import { buttonClass } from "@/lib/ui";
import Logo from "./ui/Logo";
import { SignupLink } from "./ui/Signup";

export default function Navbar() {
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

        <div className="hidden items-center gap-2 md:flex">
          <a href="#" className={`${NAV_LINK_CLASS} text-ink`}>
            Log in
          </a>
          <SignupLink className={buttonClass("primary", "md")}>Start Free Trial</SignupLink>
        </div>

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
            <a href="#" className={buttonClass("secondary", "lg")}>
              Log in
            </a>
            <SignupLink onNavigate={() => setOpen(false)} className={buttonClass("primary", "lg")}>
              Start Free Trial
            </SignupLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
