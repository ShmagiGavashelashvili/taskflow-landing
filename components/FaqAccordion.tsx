"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FaqItem } from "@/types";

interface FaqAccordionProps {
  items: FaqItem[];
}

/** Accordion where only one item is open at a time. */
export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white shadow-card">
      {items.map((item) => {
        const open = item.id === openId;
        const buttonId = `faq-button-${item.id}`;
        const panelId = `faq-panel-${item.id}`;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl px-6 py-5 text-left text-base font-bold sm:text-lg"
              >
                {item.question}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted transition-transform duration-300 motion-reduce:transition-none ${
                    open ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className={`overflow-hidden ${open ? "visible" : "invisible"}`}>
                <p className="px-6 pb-6 leading-relaxed text-muted">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
