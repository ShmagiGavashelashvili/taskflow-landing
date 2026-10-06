"use client";

import { ArrowRight, CircleCheck, Loader2, Mail } from "lucide-react";
import { useId } from "react";
import { useEmailForm } from "@/hooks/useEmailForm";
import { buttonClass } from "@/lib/ui";

interface EmailCaptureProps {
  /** DOM id for the input, so other links can focus it. */
  inputId: string;
  label: string;
  buttonLabel: string;
  successTitle: string;
  successMessage: string;
  theme?: "light" | "dark";
  className?: string;
}

export default function EmailCapture({
  inputId,
  label,
  buttonLabel,
  successTitle,
  successMessage,
  theme = "light",
  className = "",
}: EmailCaptureProps) {
  const { email, error, status, onChange, onSubmit, reset } = useEmailForm();
  const errorId = useId();
  const dark = theme === "dark";

  if (status === "success") {
    return (
      <div
        role="status"
        className={`flex items-start gap-3 rounded-2xl border p-4 text-left ${
          dark ? "border-white/15 bg-white/5 text-white" : "border-teal/25 bg-white text-ink shadow-card"
        } ${className}`}
      >
        <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
        <div>
          <p className="font-semibold">{successTitle}</p>
          <p className={`text-sm ${dark ? "text-white/70" : "text-muted"}`}>{successMessage}</p>
          <button
            type="button"
            onClick={reset}
            className={`mt-2 cursor-pointer text-sm font-semibold underline underline-offset-2 ${
              dark ? "text-white focus-visible:outline-white" : "text-brand"
            }`}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <Mail
            className={`pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 ${
              dark ? "text-white/50" : "text-muted"
            }`}
            aria-hidden="true"
          />
          <input
            id={inputId}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={onChange}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={`h-12 w-full rounded-xl border pr-4 pl-11 text-base outline-offset-2 transition-colors placeholder:text-muted/70 ${
              dark
                ? "border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:outline-white"
                : "border-line bg-white text-ink shadow-card"
            } ${error ? "border-rose-500" : ""}`}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={buttonClass(dark ? "light" : "primary", "lg", "sm:w-auto")}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              <span>Sending…</span>
            </>
          ) : (
            <>
              {buttonLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className={`mt-2 text-left text-sm font-medium ${dark ? "text-rose-300" : "text-rose-600"}`}
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
