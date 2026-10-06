"use client";

import type { MouseEvent, ReactNode } from "react";
import { SIGNUP_INPUT_ID } from "@/constants/site";

interface SignupLinkProps {
  children: ReactNode;
  className?: string;
  /** Called when the link is activated, e.g. to close a menu. */
  onNavigate?: () => void;
}

/** Scrolls to the hero email field and focuses it. Falls back to the anchor if the field is missing. */
export default function SignupLink({ children, className, onNavigate }: SignupLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();
    const input = document.getElementById(SIGNUP_INPUT_ID);
    if (!input) return;
    event.preventDefault();
    input.scrollIntoView({ block: "center" });
    input.focus({ preventScroll: true });
  }

  return (
    <a href="#get-started" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
