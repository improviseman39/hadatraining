"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export type ModuleNode = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  /** This session's own content blocks, if it has any directly (e.g. an
   * overview handout) — every one listed, not just a single shortcut. */
  materials: { id: string; label: string }[];
  subTopics: { id: string; slug: string; title: string; imageUrl: string }[];
};

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`shrink-0 text-ink/40 transition-transform ${expanded ? "rotate-90" : ""}`}
  >
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DocIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.75" />
    <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.75" />
  </svg>
);

/** Filled teal check (done), small teal bars (this is the current page),
 * or an empty ring (not started / in progress but not the current page). */
function StatusIcon({ isCurrent, percent }: { isCurrent: boolean; percent: number }) {
  if (isCurrent) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Now playing">
        <rect x="4" y="12" width="3" height="8" rx="1" fill="currentColor" />
        <rect x="10.5" y="7" width="3" height="13" rx="1" fill="currentColor" />
        <rect x="17" y="3" width="3" height="17" rx="1" fill="currentColor" />
      </svg>
    );
  }
  if (percent >= 100) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Completed">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="M7.5 12.5l3 3 6-6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Not started">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

/**
 * The session-page sidebar's full category tree: every main session in
 * this category, each collapsible to reveal its own material (every
 * block it has, not just one) and its sub-topics — so a member can see
 * and jump to anything in this category (another session's material,
 * another session's lecture) without leaving the page or hunting through
 * the top nav. The session the page is currently on/under starts expanded;
 * every other session in the category starts collapsed to just its name,
 * one click away.
 */
export default function CategoryTreeSidebar({
  category,
  categoryHref,
  modules,
  currentModuleId,
  currentSlug,
  completionBySlug = {},
}: {
  category: string;
  categoryHref: string;
  modules: ModuleNode[];
  /** Which module's branch starts expanded — the one this page is on, or
   * the parent of the sub-topic this page is on. */
  currentModuleId: string;
  /** The exact page being viewed — could be a module itself or one of its
   * sub-topics — for highlighting the current row. */
  currentSlug?: string;
  /** 0-100 completion per sub-topic slug, for the trailing status icon. */
  completionBySlug?: Record<string, number>;
}) {
  const [expandedId, setExpandedId] = useState(currentModuleId);

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-4 shadow-sm">
      <Link
        href={categoryHref}
        className="inline-block px-1 text-[11px] font-medium uppercase tracking-wide text-muted transition-colors hover:text-teal"
      >
        {category}
      </Link>

      <div className="mt-2 flex flex-col gap-0.5">
        {modules.map((mod) => {
          const isExpanded = mod.id === expandedId;
          const isCurrentModule = mod.id === currentModuleId;

          return (
            <div key={mod.id} className={isExpanded ? "rounded-xl bg-porcelain/70 p-2" : "px-2 py-1"}>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? "" : mod.id)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${mod.title}`}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-ink/5"
                >
                  <ChevronIcon expanded={isExpanded} />
                </button>
                <Link
                  href={`/sessions/${mod.slug}`}
                  className={`min-w-0 flex-1 truncate font-serif text-sm transition-colors hover:text-teal ${
                    isCurrentModule ? "font-medium text-ink" : "text-ink/70"
                  }`}
                >
                  {mod.title}
                </Link>
              </div>

              {isExpanded && (
                <div className="ml-[26px] mt-1.5 flex flex-col gap-1">
                  {mod.materials.length > 0 && (
                    <div className="flex flex-col gap-0.5 border-b border-ink/10 pb-1.5">
                      {mod.materials.map((material) => (
                        <Link
                          key={material.id}
                          href={`/sessions/${mod.slug}#block-${material.id}`}
                          className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-teal-dark transition-colors hover:text-teal"
                        >
                          <span aria-hidden="true" className="shrink-0">
                            <DocIcon />
                          </span>
                          <span className="truncate">{material.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {mod.subTopics.map((subTopic, index) => {
                    const isCurrent = subTopic.slug === currentSlug;
                    const percent = completionBySlug[subTopic.slug] ?? 0;
                    return (
                      <Link
                        key={subTopic.slug}
                        href={`/sessions/${subTopic.slug}`}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded-xl p-1.5 text-sm transition-colors ${
                          isCurrent
                            ? "bg-teal/10 text-teal-dark font-medium"
                            : "text-ink/80 hover:bg-card hover:text-teal"
                        }`}
                      >
                        <div className="relative h-[26px] w-[26px] shrink-0 overflow-hidden rounded-lg bg-porcelain">
                          <Image src={subTopic.imageUrl} alt="" fill sizes="26px" className="object-cover" />
                        </div>
                        <span className="min-w-0 flex-1 truncate">
                          <span className="mr-1.5 text-xs font-medium text-muted">{pad(index + 1)}</span>
                          {subTopic.title}
                        </span>
                        <span
                          className={`shrink-0 ${isCurrent ? "text-teal-dark" : percent >= 100 ? "text-teal" : "text-ink/25"}`}
                        >
                          <StatusIcon isCurrent={isCurrent} percent={percent} />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
