"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { registerUrl } from "@/lib/auth/paths";
import EmailCapture from "./EmailCapture";

/** The field and the link find each other through these, so they stay private to this module. */
const FIELD_ID = "hero-email";
const ANCHOR_ID = "get-started";

interface SignupFieldProps {
  className?: string;
  /** Shown under the form, e.g. a reassurance line. */
  children?: ReactNode;
}

/**
 * The main email signup form: a valid email goes to registration, pre-filled.
 * Every SignupLink on the page scrolls to and focuses it.
 */
export function SignupField({ className = "", children }: SignupFieldProps) {
  const router = useRouter();
  return (
    <div id={ANCHOR_ID} className={className}>
      <EmailCapture
        inputId={FIELD_ID}
        label="Work email"
        buttonLabel="Get Started Free"
        onValidEmail={(email) => router.push(registerUrl({ email }))}
      />
      {children}
    </div>
  );
}

interface SignupLinkProps {
  children: ReactNode;
  className?: string;
  /** Called when the link is activated, e.g. to close a menu. */
  onNavigate?: () => void;
}

/** Scrolls to the signup field and focuses it. Falls back to the anchor if the field is missing. */
export function SignupLink({ children, className, onNavigate }: SignupLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();
    const input = document.getElementById(FIELD_ID);
    if (!input) return;
    event.preventDefault();
    input.scrollIntoView({ block: "center" });
    input.focus({ preventScroll: true });
  }

  return (
    <a href={`#${ANCHOR_ID}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
