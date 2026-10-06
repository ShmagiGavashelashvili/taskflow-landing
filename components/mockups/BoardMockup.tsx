import { Bell, CalendarDays, Plus, Search } from "lucide-react";
import { BOARD_COLUMNS, BOARD_SIDEBAR, BOARD_TEAM } from "./board.data";
import { AvatarStack, TaskCard, WindowFrame } from "./primitives";

export default function BoardMockup({ className = "" }: { className?: string }) {
  return (
    <WindowFrame className={className}>
      <div className="flex">
        <div className="hidden w-14 shrink-0 flex-col items-center gap-2 border-r border-line bg-[#fbfaf7] py-4 sm:flex">
          <span className="mb-2 h-7 w-7 rounded-lg bg-gradient-to-br from-brand to-[#0fa89c]" />
          {BOARD_SIDEBAR.map(({ icon: Icon, active }, i) => (
            <span
              key={i}
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-tint text-brand" : "text-muted"}`}
            >
              <Icon className="h-4 w-4" />
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1 bg-[#fbfaf7] p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-ink sm:text-base">Website Relaunch</p>
              <p className="flex items-center gap-1 text-[10px] text-muted">
                <CalendarDays className="h-3 w-3" /> Sprint 14 · Oct 7 – Oct 21
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden h-7 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[10px] text-muted sm:flex">
                <Search className="h-3 w-3" /> Search
              </span>
              <Bell className="hidden h-4 w-4 text-muted sm:block" />
              <AvatarStack people={BOARD_TEAM} />
              <span className="flex h-7 items-center gap-1 rounded-lg bg-brand px-2.5 text-[10px] font-semibold text-white">
                <Plus className="h-3 w-3" /> Task
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {BOARD_COLUMNS.map((column, index) => (
              <div key={column.name} className={index === 2 ? "hidden lg:block" : ""}>
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                  <span className="text-xs font-bold text-ink">{column.name}</span>
                  <span className="rounded-md bg-slate-100 px-1.5 text-[10px] font-semibold text-muted">
                    {column.cards.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {column.cards.map((card, cardIndex) => (
                    <div key={card.title} className={cardIndex === 2 ? "hidden sm:block" : ""}>
                      <TaskCard {...card} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
