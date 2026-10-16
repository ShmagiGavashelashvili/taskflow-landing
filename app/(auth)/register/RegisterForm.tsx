"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import FormAlert from "@/components/forms/FormAlert";
import TextField from "@/components/forms/TextField";
import { Button } from "@/components/ui/button";
import { plans } from "@/data";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { FieldErrors } from "@/lib/api/errors";
import { APP_HOME } from "@/lib/auth/paths";
import { clearFieldError, describeFailure, validateForm } from "@/lib/forms";
import { MIN_PASSWORD_LENGTH, registerRequestSchema } from "@/lib/schemas/auth";
import type { PlanId } from "@/lib/schemas/entities";
import { cn } from "@/lib/utils";

interface RegisterFormProps {
  /** From `?email=`, typed into the landing page signup field. */
  initialEmail: string;
  /** From `?plan=`, picked on the pricing section. Pro when absent. */
  initialPlan: PlanId | null;
}

type Values = { name: string; email: string; password: string; workspaceName: string; plan: PlanId };

export default function RegisterForm({ initialEmail, initialPlan }: RegisterFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    name: "",
    email: initialEmail,
    password: "",
    workspaceName: "",
    plan: initialPlan ?? "pro",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof Values>(field: K, value: Values[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((errors) => clearFieldError(errors, field));
    if (field === "email") setEmailTaken(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setMessage(null);
    const result = validateForm(registerRequestSchema, values);
    if (!result.ok) return setFieldErrors(result.fieldErrors);

    setSubmitting(true);
    try {
      await authApi.register(result.data);
      router.replace(APP_HOME);
      router.refresh();
    } catch (error) {
      const failure = describeFailure(error);
      setFieldErrors(failure.fieldErrors);
      setMessage(failure.message);
      setEmailTaken(error instanceof ApiError && error.code === "EMAIL_TAKEN");
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-5">
      {message && <FormAlert>{message}</FormAlert>}
      <TextField
        label="Your name"
        autoComplete="name"
        value={values.name}
        onChange={(e) => set("name", e.target.value)}
        errors={fieldErrors.name}
      />
      <div className="grid gap-1.5">
        <TextField
          label="Work email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          errors={fieldErrors.email}
        />
        {emailTaken && (
          <Link href="/login" className="text-sm font-semibold text-brand hover:text-brand-strong">
            Log in instead
          </Link>
        )}
      </div>
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(e) => set("password", e.target.value)}
        errors={fieldErrors.password}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      />
      <TextField
        label="Workspace name"
        autoComplete="organization"
        placeholder="e.g. Acme Studio"
        value={values.workspaceName}
        onChange={(e) => set("workspaceName", e.target.value)}
        errors={fieldErrors.workspaceName}
      />
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-semibold text-ink">Plan</legend>
        <div className="grid grid-cols-3 gap-2">
          {plans.map((plan) => {
            const checked = values.plan === plan.id;
            return (
              <label
                key={plan.id}
                className={cn(
                  "cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-brand/20",
                  checked ? "border-brand bg-tint" : "border-line bg-surface hover:border-brand/40",
                )}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={checked}
                  onChange={() => set("plan", plan.id as PlanId)}
                  className="sr-only"
                />
                <span className="block font-semibold text-ink">{plan.name}</span>
                <span className="block text-muted-foreground">{plan.monthly === 0 ? "Free" : `$${plan.monthly}/user`}</span>
              </label>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          {values.plan === "free"
            ? "Free forever, no card needed."
            : "14-day free trial, no card needed. You'll move to Free if you don't upgrade."}
        </p>
      </fieldset>
      <Button type="submit" size="lg" className="h-11 rounded-xl text-[15px]" disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
