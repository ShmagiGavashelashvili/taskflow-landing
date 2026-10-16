"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import FormAlert from "@/components/forms/FormAlert";
import TextField from "@/components/forms/TextField";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { FieldErrors } from "@/lib/api/errors";
import { describeFailure, validateForm } from "@/lib/forms";
import { MIN_PASSWORD_LENGTH, resetPasswordRequestSchema } from "@/lib/schemas/auth";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [invalidLink, setInvalidLink] = useState(token === "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setMessage(null);
    const result = validateForm(resetPasswordRequestSchema, { token, password });
    if (!result.ok) return setFieldErrors(result.fieldErrors);

    setSubmitting(true);
    try {
      await authApi.resetPassword(result.data);
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_TOKEN") setInvalidLink(true);
      const failure = describeFailure(error);
      setFieldErrors(failure.fieldErrors);
      setMessage(failure.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="grid gap-4" role="status">
        <p className="text-[15px] text-ink">Your password has been updated. Log in with your new password.</p>
        <Button asChild size="lg" className="h-11 rounded-xl text-[15px]">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  if (invalidLink) {
    return (
      <div className="grid gap-4">
        <FormAlert>{message ?? "This reset link is invalid, expired or already used. Request a new one."}</FormAlert>
        <Button asChild size="lg" className="h-11 rounded-xl text-[15px]">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-5">
      {message && <FormAlert>{message}</FormAlert>}
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setFieldErrors({});
        }}
        errors={fieldErrors.password}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      />
      <Button type="submit" size="lg" className="h-11 rounded-xl text-[15px]" disabled={submitting}>
        {submitting ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
