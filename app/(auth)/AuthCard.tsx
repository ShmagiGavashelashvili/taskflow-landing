import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Under the card, e.g. "No account? Sign up". */
  footer?: ReactNode;
}

/** The card every auth page renders into. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <>
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-muted-foreground">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
    </>
  );
}

/** Placeholder while a form waits for its URL parameters. */
export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="grid gap-5" aria-hidden="true">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="grid gap-1.5">
          <div className="h-4 w-24 rounded bg-tint" />
          <div className="h-11 rounded-xl bg-tint" />
        </div>
      ))}
      <div className="h-11 rounded-xl bg-brand/30" />
    </div>
  );
}
