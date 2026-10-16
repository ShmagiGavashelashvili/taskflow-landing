"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The demo forms don't send anything, so this fakes a network round trip. */
const SIMULATED_LATENCY_MS = 800;

function validateEmail(value: string): string | null {
  const email = value.trim();
  if (email === "") return "Please enter your email address.";
  if (!EMAIL_PATTERN.test(email)) return "That doesn't look like a valid email address.";
  return null;
}

export type EmailFormStatus = "idle" | "submitting" | "success";

export interface EmailForm {
  email: string;
  error: string | null;
  status: EmailFormStatus;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  reset: () => void;
}

export interface EmailFormOptions {
  /**
   * Receives the trimmed email once it's valid, replacing the simulated submission
   * (e.g. to navigate to registration). The form stays idle.
   */
  onValidEmail?: (email: string) => void;
}

/**
 * Validates an email. Without `onValidEmail` it walks through idle → submitting → success,
 * simulated: this is a demo, so nothing is sent or stored.
 */
export function useEmailForm({ onValidEmail }: EmailFormOptions = {}): EmailForm {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<EmailFormStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    setError(null);
  }, []);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "submitting") return;
      const validationError = validateEmail(email);
      if (validationError) {
        setError(validationError);
        return;
      }
      if (onValidEmail) {
        onValidEmail(email.trim());
        return;
      }
      setStatus("submitting");
      timer.current = setTimeout(() => setStatus("success"), SIMULATED_LATENCY_MS);
    },
    [email, status, onValidEmail],
  );

  const reset = useCallback(() => {
    setEmail("");
    setError(null);
    setStatus("idle");
  }, []);

  return { email, error, status, onChange, onSubmit, reset };
}
