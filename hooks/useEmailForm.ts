"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { SIMULATED_LATENCY_MS } from "@/constants/forms";
import { validateEmail } from "@/lib/validateEmail";

export type EmailFormStatus = "idle" | "submitting" | "success";

export interface EmailForm {
  email: string;
  error: string | null;
  status: EmailFormStatus;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  reset: () => void;
}

/**
 * Validates an email and walks through idle → submitting → success.
 * Submission is simulated: this is a demo, so nothing is sent or stored.
 */
export function useEmailForm(): EmailForm {
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
      setStatus("submitting");
      timer.current = setTimeout(() => setStatus("success"), SIMULATED_LATENCY_MS);
    },
    [email, status],
  );

  const reset = useCallback(() => {
    setEmail("");
    setError(null);
    setStatus("idle");
  }, []);

  return { email, error, status, onChange, onSubmit, reset };
}
