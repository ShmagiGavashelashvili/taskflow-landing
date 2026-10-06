import { TIMELINE_DAY_LABELS, TIMELINE_DAYS, TIMELINE_ROWS } from "@/constants/mockups";
import { BAR_TONE_CLASSES } from "@/constants/ui";
import { WindowFrame } from "./primitives";

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
            {TIMELINE_DAY_LABELS.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
          {TIMELINE_ROWS.map((row) => (
            <div key={row.name} className="contents">
              <div className="flex items-center border-b border-line/70 py-2.5 pr-2 text-[11px] font-semibold text-ink sm:text-xs">
                {row.name}
              </div>
              <div className="relative grid grid-cols-14 items-center border-b border-line/70 py-2.5">
                {Array.from({ length: TIMELINE_DAYS }).map((_, i) => (
                  <span
                    key={i}
                    className={`absolute inset-y-0 w-px bg-line/60 ${i === 0 ? "hidden" : ""}`}
                    style={{ left: `${(i / TIMELINE_DAYS) * 100}%` }}
                  />
                ))}
                <div
                  className="relative h-5 overflow-hidden rounded-md bg-slate-200/70 sm:h-6"
                  style={{ gridColumn: `${row.start} / ${row.end}` }}
                >
                  <div className={`h-full rounded-md ${BAR_TONE_CLASSES[row.tone]}`} style={{ width: `${row.progress}%` }} />
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
