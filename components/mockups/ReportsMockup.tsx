import { TrendingUp } from "lucide-react";
import { WindowFrame } from "./primitives";

const velocity = [
  { week: "W1", value: 42 },
  { week: "W2", value: 55 },
  { week: "W3", value: 48 },
  { week: "W4", value: 66 },
  { week: "W5", value: 72 },
  { week: "W6", value: 84 },
];

const kpis = [
  { label: "Tasks completed", value: "128", delta: "+18%" },
  { label: "On-time rate", value: "94%", delta: "+6%" },
  { label: "Avg. cycle time", value: "3.2d", delta: "-0.8d" },
];

const ideal = "0,10 100,70";
const actual = "0,10 20,22 40,38 60,44 80,58 100,66";

export default function ReportsMockup({ className = "" }: { className?: string }) {
  const max = Math.max(...velocity.map((v) => v.value));
  return (
    <WindowFrame className={className} url="app.taskflow.demo/reports">
      <div className="bg-[#fbfaf7] p-3 sm:p-5">
        <p className="mb-4 text-sm font-extrabold text-ink sm:text-base">Team performance · Last 6 weeks</p>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-line bg-white p-2.5 sm:p-3">
              <p className="text-[10px] text-muted">{kpi.label}</p>
              <p className="mt-1 text-lg font-extrabold text-ink sm:text-2xl">{kpi.value}</p>
              <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> {kpi.delta}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-3">
            <p className="mb-3 text-xs font-bold text-ink">Velocity</p>
            <div className="flex h-24 items-end gap-2 sm:h-32">
              {velocity.map((v) => (
                <div key={v.week} className="flex h-full flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-brand to-[#0fa89c]"
                      style={{ height: `${(v.value / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted">{v.week}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-white p-3">
            <p className="mb-3 flex items-center justify-between text-xs font-bold text-ink">
              Sprint burndown
              <span className="flex items-center gap-2 text-[9px] font-medium text-muted">
                <span className="flex items-center gap-1">
                  <span className="h-0.5 w-3 bg-slate-300" /> Ideal
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-0.5 w-3 bg-brand" /> Actual
                </span>
              </span>
            </p>
            <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="h-24 w-full sm:h-32">
              {[20, 40, 60].map((y) => (
                <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#e6e1d6" strokeWidth="0.5" />
              ))}
              <polyline points={ideal} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
              <polyline points={actual} fill="none" stroke="#1b4ddb" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
