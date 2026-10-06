import { barTone, WindowFrame } from "./primitives";
import type { Tone } from "./primitives";

interface Row {
  name: string;
  tone: Tone;
  /** 1-based start column and exclusive end column on the 14-day grid. */
  start: number;
  end: number;
  progress: number;
}

const DAYS = 14;
const dayLabels = ["M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "F", "S", "S"];

const rows: Row[] = [
  { name: "Research", tone: "rose", start: 1, end: 5, progress: 100 },
  { name: "Wireframes", tone: "blue", start: 3, end: 8, progress: 85 },
  { name: "Visual design", tone: "violet", start: 5, end: 11, progress: 55 },
  { name: "Build", tone: "teal", start: 7, end: 14, progress: 30 },
  { name: "Content", tone: "amber", start: 8, end: 13, progress: 20 },
  { name: "Launch", tone: "slate", start: 12, end: 15, progress: 0 },
];

export default function TimelineMockup({ className = "" }: { className?: string }) {
  return (
    <WindowFrame className={className} url="app.taskflow.demo/timeline">
      <div className="bg-[#fbfaf7] p-3 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-extrabold text-ink sm:text-base">Website Relaunch · Timeline</p>
          <span className="rounded-lg border border-line bg-white px-2.5 py-1 text-[10px] font-semibold text-muted">
            Oct 7 – Oct 20
          </span>
        </div>
        <div className="grid grid-cols-[5.5rem_1fr] sm:grid-cols-[8rem_1fr]">
          <div />
          <div className="grid grid-cols-14 border-b border-line pb-2 text-center text-[10px] font-semibold text-muted">
            {dayLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
          {rows.map((row) => (
            <div key={row.name} className="contents">
              <div className="flex items-center border-b border-line/70 py-2.5 pr-2 text-[11px] font-semibold text-ink sm:text-xs">
                {row.name}
              </div>
              <div className="relative grid grid-cols-14 items-center border-b border-line/70 py-2.5">
                {Array.from({ length: DAYS }).map((_, i) => (
                  <span
                    key={i}
                    className={`absolute inset-y-0 w-px bg-line/60 ${i === 0 ? "hidden" : ""}`}
                    style={{ left: `${(i / DAYS) * 100}%` }}
                  />
                ))}
                <div
                  className="relative h-5 overflow-hidden rounded-md bg-slate-200/70 sm:h-6"
                  style={{ gridColumn: `${row.start} / ${row.end}` }}
                >
                  <div className={`h-full rounded-md ${barTone[row.tone]}`} style={{ width: `${row.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] text-muted">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> On track · 4 of 6 phases ahead of schedule
        </div>
      </div>
    </WindowFrame>
  );
}
