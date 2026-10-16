"use client";

import { useState } from "react";

/**
 * Wraps the session page's two-column split so the sidebar can be
 * collapsed to give the content column the full width — a desktop-only
 * nicety (lg: and up); on narrower screens the sidebar already stacks
 * below the content regardless of this toggle, so it's left alone there.
 * Collapsing hides the sidebar via CSS rather than unmounting it, so
 * NotesPanel's in-progress (not-yet-saved) text isn't lost by toggling.
 */
export default function SessionLayout({
  main,
  sidebar,
}: {
  main: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative mt-8">
      <div
        className={`grid grid-cols-1 gap-8 lg:items-start lg:gap-10 ${
          collapsed ? "" : "lg:grid-cols-[1fr_320px]"
        }`}
      >
        <div className="min-w-0">{main}</div>

        <aside
          className={`relative flex flex-col gap-5 lg:sticky lg:top-24 ${
            collapsed ? "lg:hidden" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Hide sidebar"
            className="absolute -left-3 top-0 hidden h-7 w-7 items-center justify-center rounded-full border border-ink/15 bg-card text-ink/60 shadow-sm transition-colors hover:border-teal hover:text-teal lg:flex"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {sidebar}
        </aside>
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Show sidebar"
          className="fixed right-4 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink/15 bg-card text-ink/60 shadow-md transition-colors hover:border-teal hover:text-teal lg:flex"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
