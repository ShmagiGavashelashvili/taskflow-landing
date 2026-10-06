import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
  /** Id of the heading that labels this section, for assistive tech. */
  labelledBy?: string;
}

export default function Section({ id, className = "", children, labelledBy }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`py-20 sm:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  );
}

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionHeading({ id, eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
      <p className="mb-3 text-sm font-bold tracking-widest text-teal uppercase">{eyebrow}</p>
      <h2 id={id} className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg leading-relaxed text-pretty text-muted">{description}</p>
      ) : null}
    </div>
  );
}
