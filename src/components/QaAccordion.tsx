"use client";

import { useState } from "react";
import type { QaEntry } from "@/types/content";

export default function QaAccordion({ entries }: { entries: QaEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(entries[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => {
        const isOpen = openId === entry.id;
        return (
          <div
            key={entry.id}
            className="overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : entry.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-serif text-base text-ink">{entry.question}</span>
              <span
                aria-hidden="true"
                className={`shrink-0 text-teal transition-transform ${isOpen ? "rotate-45" : ""}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            {isOpen && (
              <p className="whitespace-pre-wrap px-5 pb-5 text-sm leading-relaxed text-ink/80">
                {entry.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
