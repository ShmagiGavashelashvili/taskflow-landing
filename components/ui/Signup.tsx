"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { registerUrl } from "@/lib/auth/paths";
import EmailCapture from "./EmailCapture";

const FIELD_ID = "hero-email";
const ANCHOR_ID = "get-started";

interface SignupFieldProps {
  className?: string;
  /** Shown under the form, e.g. a reassurance line. */
  children?: ReactNode;
}

/**
 * The main email signup form: a valid email goes to registration, pre-filled. Its wrapper is
 * the `#get-started` anchor that in-page links point at.
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
