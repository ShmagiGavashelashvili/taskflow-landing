"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import FormAlert from "@/components/forms/FormAlert";
import TextField from "@/components/forms/TextField";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";
import type { FieldErrors } from "@/lib/api/errors";
import { describeFailure, validateForm } from "@/lib/forms";
import { forgotPasswordRequestSchema } from "@/lib/schemas/auth";

type Sent = { resetUrl: string | null };

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setMessage(null);
    const result = validateForm(forgotPasswordRequestSchema, { email });
    if (!result.ok) return setFieldErrors(result.fieldErrors);

    setSubmitting(true);
    try {
      setSent(await authApi.forgotPassword(result.data));
    } catch (error) {
      const failure = describeFailure(error);
      setFieldErrors(failure.fieldErrors);
      setMessage(failure.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="grid gap-4 text-[15px]" role="status">
        <p className="text-ink">If an account exists for that email, a reset link is on its way.</p>
        {sent.resetUrl ? (
          <div className="rounded-xl border border-brand/20 bg-tint px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              This prototype doesn&apos;t send email, so here is the link. It works once and expires in an hour.
            </p>
            <Link href={sent.resetUrl} className="mt-2 inline-block font-semibold text-brand hover:text-brand-strong">
              Reset your password
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">(Demo: no account uses that email, so no link was created.)</p>
        )}
        <Button variant="outline" className="h-11 rounded-xl" onClick={() => setSent(null)}>
          Try another email
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-5">
      {message && <FormAlert>{message}</FormAlert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setFieldErrors({});
        }}
        errors={fieldErrors.email}
      />
      <Button type="submit" size="lg" className="h-11 rounded-xl text-[15px]" disabled={submitting}>
        {submitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
