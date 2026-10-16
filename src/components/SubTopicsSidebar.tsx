import Image from "next/image";
import Link from "next/link";
import type { Session } from "@/types/content";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

type Row = { slug: string; title: string; imageUrl: string };

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
 * One continuous lecture list for the session-page sidebar. When viewing a
 * sub-topic (`parentSession` set), the main session it belongs to is row
 * "00" at the top of the very same list, not a separate box above it — the
 * breadcrumb already handles "back to the main session" navigation, so this
 * list's only job is showing every lecture in the module side by side.
 */
export default function SubTopicsSidebar({
  listTitle,
  subTopics,
  currentSlug,
  parentSession,
  completionBySlug = {},
}: {
  /** Heading above the list — the module/top-level session's own title. */
  listTitle: string;
  subTopics: Session[];
  currentSlug?: string;
  /** Set only when viewing a sub-topic — the main session it belongs to. */
  parentSession?: Row | null;
  /** 0-100 completion per session slug, for the trailing status icon. */
  completionBySlug?: Record<string, number>;
}) {
  const rows: Row[] = parentSession ? [parentSession, ...subTopics] : subTopics;

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-4 shadow-sm">
      <h2 className="truncate px-1 font-serif text-base text-ink">{listTitle}</h2>
      <p className="mt-1 px-1 text-xs text-muted">
        {subTopics.length} Lecture{subTopics.length > 1 ? "s" : ""}
      </p>
      <ul className="mt-3 flex flex-col gap-1">
        {rows.map((row, index) => {
          const isCurrent = row.slug === currentSlug;
          const percent = completionBySlug[row.slug] ?? 0;
          return (
            <li key={row.slug}>
              <Link
                href={`/sessions/${row.slug}`}
                aria-current={isCurrent ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl p-2 text-sm transition-colors ${
                  isCurrent
                    ? "bg-teal/10 text-teal-dark font-medium"
                    : "text-ink/80 hover:bg-porcelain hover:text-teal"
                }`}
              >
                <div className="relative h-[30px] w-[30px] shrink-0 overflow-hidden rounded-lg bg-porcelain">
                  <Image src={row.imageUrl} alt="" fill sizes="30px" className="object-cover" />
                </div>
                <span className="min-w-0 flex-1 truncate">
                  <span className="mr-1.5 text-xs font-medium text-muted">{pad(index)}</span>
                  {row.title}
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
