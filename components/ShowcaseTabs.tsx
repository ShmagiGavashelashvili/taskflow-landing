"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import type { ShowcaseTab, ShowcaseTabId } from "@/types";

interface ShowcaseTabsProps {
  tabs: ShowcaseTab[];
  /** Server-rendered mockups, keyed by tab id. */
  panels: Record<ShowcaseTabId, ReactNode>;
}

export default function ShowcaseTabs({ tabs, panels }: ShowcaseTabsProps) {
  const [activeId, setActiveId] = useState<ShowcaseTabId>(tabs[0].id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  function select(id: ShowcaseTabId) {
    setActiveId(id);
    tabRefs.current[id]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === activeId);
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next === -1) return;
    event.preventDefault();
    select(tabs[next].id);
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Product views"
        onKeyDown={onKeyDown}
        className="mx-auto mb-10 flex w-fit max-w-full gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-card"
      >
        {tabs.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={`showcase-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls="showcase-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              className={`cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors motion-reduce:transition-none sm:px-7 ${
                selected ? "bg-brand text-white shadow-card" : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="showcase-panel"
        aria-labelledby={`showcase-tab-${activeId}`}
        tabIndex={0}
        className="rounded-2xl"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14"
          >
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{active.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-muted">{active.description}</p>
              <ul className="mt-6 space-y-3">
                {active.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-3 font-medium">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint text-brand">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 min-w-0 lg:order-2">{panels[active.id]}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
