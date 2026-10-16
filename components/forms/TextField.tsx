import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  /** First message is shown under the field and announced as its description. */
  errors?: string[];
  /** Helper text shown when there's no error. */
  hint?: ReactNode;
  /** Extra content on the label row, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode;
}

/** A labelled input with an accessible error message. Shared by the auth and settings forms. */
export default function TextField({ label, errors, hint, labelAside, className, ...input }: TextFieldProps) {
  const id = useId();
  const error = errors?.[0];
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {labelAside}
      </div>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink shadow-xs outline-none transition-colors placeholder:text-muted/70",
          "focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/15 disabled:opacity-60",
        )}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
