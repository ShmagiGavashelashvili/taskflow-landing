"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import FormAlert from "@/components/forms/FormAlert";
import TextField from "@/components/forms/TextField";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";
import type { FieldErrors } from "@/lib/api/errors";
import { APP_HOME } from "@/lib/auth/paths";
import { clearFieldError, describeFailure, validateForm } from "@/lib/forms";
import { loginRequestSchema } from "@/lib/schemas/auth";

interface LoginFormProps {
  /** Safe path to return to after login. */
  next: string | null;
  /** Shown as a hint in demo mode. */
  demoAccount: { email: string; password: string } | null;
}

export default function LoginForm({ next, demoAccount }: LoginFormProps) {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((errors) => clearFieldError(errors, field));
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setMessage(null);
    const result = validateForm(loginRequestSchema, values);
    if (!result.ok) return setFieldErrors(result.fieldErrors);

    setSubmitting(true);
    try {
      await authApi.login(result.data);
      router.replace(next ?? APP_HOME);
      router.refresh();
    } catch (error) {
      const failure = describeFailure(error);
      setFieldErrors(failure.fieldErrors);
      setMessage(failure.message);
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-5">
      {demoAccount && (
        <div className="rounded-xl border border-brand/20 bg-tint px-4 py-3 text-sm text-ink">
          <p className="font-semibold">Exploring the demo?</p>
          <p className="mt-1 text-muted-foreground">
            Log in as <span className="font-medium text-ink">{demoAccount.email}</span> with password{" "}
            <span className="font-medium text-ink">{demoAccount.password}</span>.
          </p>
          <button
            type="button"
            className="mt-2 font-semibold text-brand hover:text-brand-strong"
            onClick={() => {
              setValues({ ...demoAccount });
              setFieldErrors({});
            }}
          >
            Use demo account
          </button>
        </div>
      )}
      {message && <FormAlert>{message}</FormAlert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(e) => set("email")(e.target.value)}
        errors={fieldErrors.email}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        onChange={(e) => set("password")(e.target.value)}
        errors={fieldErrors.password}
        labelAside={
          <Link href="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-strong">
            Forgot password?
          </Link>
        }
      />
      <Button type="submit" size="lg" className="h-11 rounded-xl text-[15px]" disabled={submitting}>
        {submitting ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
