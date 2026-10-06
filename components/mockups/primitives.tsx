import type { ReactNode } from "react";
import Avatar from "@/components/ui/Avatar";
import { BADGE_TONE_CLASSES, BAR_TONE_CLASSES } from "@/constants/ui";
import type { Person, Tone } from "@/types";

interface WindowFrameProps {
  children: ReactNode;
  url?: string;
  className?: string;
}

/** Browser-style window chrome around a mockup. Mockups are decorative, so the frame is hidden from assistive tech. */
export function WindowFrame({ children, url = "app.taskflow.demo", className = "" }: WindowFrameProps) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-2xl border border-line bg-white shadow-float ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-line bg-[#f6f3ec] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <div className="mx-auto flex h-6 w-full max-w-60 items-center justify-center rounded-md bg-white text-[10px] text-muted">
          {url}
        </div>
        <div className="w-10" />
      </div>
      {children}
    </div>
  );
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${BADGE_TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: Tone }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${BAR_TONE_CLASSES[tone]}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function AvatarStack({ people }: { people: Person[] }) {
  return (
    <div className="flex -space-x-1.5">
      {people.map((person) => (
        <Avatar key={person.initials} initials={person.initials} tone={person.tone} size="sm" />
      ))}
    </div>
  );
}

interface TaskCardProps {
  title: string;
  tag: string;
  tagTone: Tone;
  due: string;
  people: Person[];
  progress?: number;
  done?: boolean;
}

export function TaskCard({ title, tag, tagTone, due, people, progress, done }: TaskCardProps) {
  return (
    <div className="rounded-xl border border-line bg-white p-3 shadow-[0_1px_2px_rgb(14_26_43/0.05)]">
      <Badge tone={tagTone}>{tag}</Badge>
      <p className={`mt-2 text-xs leading-snug font-semibold ${done ? "text-muted line-through" : "text-ink"}`}>
        {title}
      </p>
      {progress !== undefined ? (
        <div className="mt-2.5 flex items-center gap-2">
          <ProgressBar value={progress} tone={tagTone} />
          <span className="text-[10px] font-semibold text-muted tabular-nums">{progress}%</span>
        </div>
      ) : null}
      <div className="mt-2.5 flex items-center justify-between">
        <AvatarStack people={people} />
        <span className="text-[10px] text-muted">{due}</span>
      </div>
    </div>
  );
}
