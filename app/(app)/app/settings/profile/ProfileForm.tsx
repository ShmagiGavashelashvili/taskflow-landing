"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import TextField from "@/components/forms/TextField";
import { Button } from "@/components/ui/button";
import { meApi } from "@/lib/api/auth";
import type { FieldErrors } from "@/lib/api/errors";
import { describeFailure, validateForm } from "@/lib/forms";
import { updateProfileRequestSchema } from "@/lib/schemas/auth";

export default function ProfileForm({ name: initialName, email }: { name: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(initialName);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const result = validateForm(updateProfileRequestSchema, { name });
    if (!result.ok) return setFieldErrors(result.fieldErrors);

    setSubmitting(true);
    try {
      const user = await meApi.update(result.data);
      setName(user.name);
      setSaved(user.name);
      toast.success("Profile updated");
      router.refresh(); // the sidebar shows the name too
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
        label="Name"
        autoComplete="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setFieldErrors({});
        }}
        errors={fieldErrors.name}
      />
      <TextField label="Email" type="email" value={email} disabled readOnly hint="Email changes aren't supported yet." />
      <div>
        <Button type="submit" disabled={submitting || name.trim() === saved}>
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
