"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import TextField from "@/components/forms/TextField";
import { Button } from "@/components/ui/button";
import { meApi } from "@/lib/api/auth";
import type { FieldErrors } from "@/lib/api/errors";
import { clearFieldError, describeFailure, validateForm } from "@/lib/forms";
import { changePasswordRequestSchema } from "@/lib/schemas/auth";

const EMPTY = { currentPassword: "", newPassword: "" };

export default function ChangePasswordForm() {
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof EMPTY) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((errors) => clearFieldError(errors, field));
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const result = validateForm(changePasswordRequestSchema, values);
    if (!result.ok) return setFieldErrors(result.fieldErrors);

    setSubmitting(true);
    try {
      await meApi.changePassword(result.data);
      setValues(EMPTY);
      toast.success("Password changed");
    } catch (error) {
      const failure = describeFailure(error);
      setFieldErrors(failure.fieldErrors);
      if (failure.message) toast.error(failure.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid max-w-md gap-5">
      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={(e) => set("currentPassword")(e.target.value)}
        errors={fieldErrors.currentPassword}
      />
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        value={values.newPassword}
        onChange={(e) => set("newPassword")(e.target.value)}
        errors={fieldErrors.newPassword}
      />
      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Changing…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
