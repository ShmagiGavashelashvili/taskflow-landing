"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import FormAlert from "@/components/forms/FormAlert";
import TextField from "@/components/forms/TextField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BAR_TONE_CLASSES } from "@/constants/tones";
import { BILLING_PATH, projectPath } from "@/lib/app-paths";
import { ApiError } from "@/lib/api/client";
import type { FieldErrors } from "@/lib/api/errors";
import { projectsApi } from "@/lib/api/projects";
import { describeFailure, validateForm } from "@/lib/forms";
import { PROJECT_COLORS, type Project } from "@/lib/schemas/entities";
import { createProjectRequestSchema } from "@/lib/schemas/projects";
import { cn } from "@/lib/utils";

type ProjectColor = Project["color"];

interface ProjectDialogProps {
  /** Edit this project; omit to create one. */
  project?: Pick<Project, "id" | "name" | "description" | "color">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create or edit a project: name, description and colour. Creating opens the new board;
 * hitting the plan's project cap shows an upgrade prompt instead of a generic error.
 */
export default function ProjectDialog({ project, open, onOpenChange }: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {project ? "Rename or recolour this project." : "Group related tasks on their own board."}
          </DialogDescription>
        </DialogHeader>
        {/* Remounted per open so the form starts from the project's current values. */}
        {open && <ProjectForm project={project} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({ project, onDone }: { project?: ProjectDialogProps["project"]; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState<ProjectColor>(project?.color ?? "blue");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<ReactNode>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const result = validateForm(createProjectRequestSchema, { name, description, color });
    if (!result.ok) return setFieldErrors(result.fieldErrors);

    setSubmitting(true);
    setAlert(null);
    try {
      if (project) {
        await projectsApi.update(project.id, result.data);
        toast.success("Project updated");
      } else {
        const created = await projectsApi.create(result.data);
        toast.success(`Created ${created.name}`);
        router.push(projectPath(created.id));
      }
      router.refresh(); // the sidebar and page header are server-rendered
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.code === "PLAN_LIMIT_REACHED") {
        setAlert(<UpgradePrompt message={error.message} />);
      } else {
        const failure = describeFailure(error);
        setFieldErrors(failure.fieldErrors);
        setAlert(failure.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-5">
      {alert && <FormAlert>{alert}</FormAlert>}
      <TextField
        label="Name"
        value={name}
        maxLength={60}
        autoFocus
        onChange={(event) => {
          setName(event.target.value);
          setFieldErrors({});
        }}
        errors={fieldErrors.name}
      />
      <div className="grid gap-1.5">
        <label htmlFor="project-description" className="text-sm font-semibold text-ink">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="project-description"
          value={description}
          maxLength={500}
          rows={3}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={fieldErrors.description ? true : undefined}
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink shadow-xs outline-none focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20"
        />
        {fieldErrors.description && <p className="text-sm text-destructive">{fieldErrors.description[0]}</p>}
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-semibold text-ink">Colour</legend>
        <div className="flex gap-2.5">
          {PROJECT_COLORS.map((option) => (
            <label key={option} className="relative cursor-pointer">
              <input
                type="radio"
                name="project-color"
                value={option}
                checked={color === option}
                onChange={() => setColor(option)}
                className="peer sr-only"
              />
              <span className="sr-only">{option}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "block size-7 rounded-full ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-[3px] peer-focus-visible:ring-brand/40",
                  BAR_TONE_CLASSES[option],
                )}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : project ? "Save changes" : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Shown when the plan's active project cap is reached. */
export function UpgradePrompt({ message }: { message: string }) {
  return (
    <span>
      {message}{" "}
      <Link href={BILLING_PATH} className="font-semibold underline underline-offset-2">
        See plans
      </Link>
    </span>
  );
}
