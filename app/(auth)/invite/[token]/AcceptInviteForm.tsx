"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import FormAlert from "@/components/forms/FormAlert";
import TextField from "@/components/forms/TextField";
import { Button } from "@/components/ui/button";
import type { FieldErrors } from "@/lib/api/errors";
import { ApiError } from "@/lib/api/client";
import { inviteApi } from "@/lib/api/workspace";
import { APP_HOME } from "@/lib/auth/paths";
import { clearFieldError, describeFailure, validateForm } from "@/lib/forms";
import { acceptInviteRequestSchema } from "@/lib/schemas/workspace";

type Mode = "register" | "login";

interface AcceptInviteFormProps {
  token: string;
  email: string;
  workspaceName: string;
  /** Start on login when the invited email already has an account. */
  accountExists: boolean;
}

/** Joins a workspace from an invite link, by creating an account or logging in as the invited email. */
export default function AcceptInviteForm({ token, email, workspaceName, accountExists }: AcceptInviteFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(accountExists ? "login" : "register");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchTo(next: Mode) {
    setMode(next);
    setFieldErrors({});
    setMessage(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setMessage(null);
    const result = validateForm(acceptInviteRequestSchema, mode === "register" ? { mode, name, password } : { mode, password });
    if (!result.ok) return setFieldErrors(result.fieldErrors);

    setSubmitting(true);
    try {
      await inviteApi.accept(token, result.data);
      router.replace(APP_HOME);
      router.refresh();
    } catch (error) {
      const failure = describeFailure(error);
      setFieldErrors(failure.fieldErrors);
      setMessage(failure.message);
      if (error instanceof ApiError && error.code === "EMAIL_TAKEN") setMode("login");
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-5">
      {message && <FormAlert>{message}</FormAlert>}
      <TextField label="Email" type="email" value={email} disabled readOnly hint="Invites are tied to the invited email." />
      {mode === "register" && (
        <TextField
          label="Your name"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFieldErrors((errors) => clearFieldError(errors, "name"));
          }}
          errors={fieldErrors.name}
        />
      )}
      <TextField
        label="Password"
        type="password"
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setFieldErrors((errors) => clearFieldError(errors, "password"));
        }}
        errors={fieldErrors.password}
        hint={mode === "register" ? "At least 8 characters." : undefined}
      />
      <Button type="submit" size="lg" className="h-11 rounded-xl text-[15px]" disabled={submitting}>
        {submitting ? "Joining…" : mode === "register" ? `Create account and join ${workspaceName}` : `Log in and join ${workspaceName}`}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "register" ? "Already have an account?" : "New to TaskFlow?"}{" "}
        <button
          type="button"
          onClick={() => switchTo(mode === "register" ? "login" : "register")}
          className="font-semibold text-brand hover:text-brand-strong"
        >
          {mode === "register" ? "Log in instead" : "Create an account"}
        </button>
      </p>
    </form>
  );
}
