import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A form-level message, e.g. a failed login. Announced to screen readers when it appears. */
export default function FormAlert({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      role="alert"
      className={cn("rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive", className)}
    >
      {children}
    </p>
  );
}
