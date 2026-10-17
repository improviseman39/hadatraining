import Image from "next/image";
import Link from "next/link";
import type { Session } from "@/types/content";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Filled teal check (done), small teal bars (this is the current page),
 * or an empty ring (not started / in progress but not the current page) —
 * same three states the curriculum page's own cards already use, just as
 * a compact trailing icon instead of a text pill. */
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
 * The session-page sidebar's lecture list — headed by a small Category →
 * Main session hierarchy so it's clear, without scrolling back up to the
 * page's own breadcrumb, where every listed lecture sits: which category
 * it's filed under, and which main session it belongs to (clickable to
 * jump up a level, same as the page-level breadcrumb does). Below that,
 * just the sub-topics themselves — the main session no longer appears as
 * a disguised "00" row in its own lecture list, since the heading above
 * already links back to it.
 */
export default function SubTopicsSidebar({
  category,
  categoryHref,
  moduleTitle,
  moduleSlug,
  isOnModulePage,
  moduleMaterialHref,
  subTopics,
  currentSlug,
  completionBySlug = {},
}: {
  /** The session's category (e.g. "Injectables") — links to that category's curriculum tab. */
  category: string;
  categoryHref: string;
  /** The top-level session's own title (e.g. "HA Filler"). */
  moduleTitle: string;
  moduleSlug: string;
  /** True when the page currently being viewed IS the main session itself
   * (not one of its sub-topics) — in that case the title is the current
   * page, so it renders as plain text rather than a link to itself. */
  isOnModulePage: boolean;
  /** Set only from a sub-topic page, and only when the main session has its
   * own content blocks (e.g. an overview handout) — a shortcut straight to
   * that material, since it otherwise isn't reachable from this list at
   * all (the list below only covers the sub-topics, not the module's own
   * blocks). Not shown while already on the module's own page — that
   * material is already visible in the main column there. */
  moduleMaterialHref?: string | null;
  subTopics: Session[];
  currentSlug?: string;
  /** 0-100 completion per session slug, for the trailing status icon. */
  completionBySlug?: Record<string, number>;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-4 shadow-sm">
      <Link
        href={categoryHref}
        className="inline-block px-1 text-[11px] font-medium uppercase tracking-wide text-muted transition-colors hover:text-teal"
      >
        {category}
      </Link>
      {isOnModulePage ? (
        <h2 className="mt-1 truncate px-1 font-serif text-base text-ink">{moduleTitle}</h2>
      ) : (
        <Link
          href={`/sessions/${moduleSlug}`}
          className="mt-1 block truncate px-1 font-serif text-base text-ink transition-colors hover:text-teal"
        >
          {moduleTitle}
        </Link>
      )}

      {moduleMaterialHref && (
        <Link
          href={moduleMaterialHref}
          className="mt-2 flex items-center gap-2 rounded-lg px-1 py-1 text-xs font-medium text-teal-dark transition-colors hover:text-teal"
        >
          <span
            aria-hidden="true"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/10"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.75" />
              <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          </span>
          Session material
        </Link>
      )}

      <p className="mt-2 px-1 text-xs text-muted">
        {subTopics.length} Lecture{subTopics.length > 1 ? "s" : ""}
      </p>
      <ul className="mt-3 flex flex-col gap-1 border-t border-ink/10 pt-3">
        {subTopics.map((subTopic, index) => {
          const isCurrent = subTopic.slug === currentSlug;
          const percent = completionBySlug[subTopic.slug] ?? 0;
          return (
            <li key={subTopic.slug}>
              <Link
                href={`/sessions/${subTopic.slug}`}
                aria-current={isCurrent ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl p-2 text-sm transition-colors ${
                  isCurrent
                    ? "bg-teal/10 text-teal-dark font-medium"
                    : "text-ink/80 hover:bg-porcelain hover:text-teal"
                }`}
              >
                <div className="relative h-[30px] w-[30px] shrink-0 overflow-hidden rounded-lg bg-porcelain">
                  <Image src={subTopic.imageUrl} alt="" fill sizes="30px" className="object-cover" />
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
