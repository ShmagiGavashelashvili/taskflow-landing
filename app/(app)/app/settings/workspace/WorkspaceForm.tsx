"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import TextField from "@/components/forms/TextField";
import { Button } from "@/components/ui/button";
import type { FieldErrors } from "@/lib/api/errors";
import { workspaceApi } from "@/lib/api/workspace";
import { describeFailure, validateForm } from "@/lib/forms";
import { updateWorkspaceRequestSchema } from "@/lib/schemas/workspace";

/** Renames the workspace. Members see the name read-only. */
export default function WorkspaceForm({ name: initialName, canEdit }: { name: string; canEdit: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(initialName);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !canEdit) return;
    const result = validateForm(updateWorkspaceRequestSchema, { name });
    if (!result.ok) return setFieldErrors(result.fieldErrors);

    setSubmitting(true);
    try {
      const { workspace } = await workspaceApi.update(result.data);
      setName(workspace.name);
      setSaved(workspace.name);
      toast.success("Workspace renamed");
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
        label="Workspace name"
        autoComplete="organization"
        value={name}
        disabled={!canEdit}
        readOnly={!canEdit}
        hint={canEdit ? undefined : "Only the workspace owner can rename it."}
        onChange={(e) => {
          setName(e.target.value);
          setFieldErrors({});
        }}
        errors={fieldErrors.name}
      />
      {canEdit && (
        <div>
          <Button type="submit" disabled={submitting || name.trim() === saved}>
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </form>
  );
}
