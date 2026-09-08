"use client";

import Image from "next/image";
import Link from "next/link";
import type { Session } from "@/types/content";
import { useAuth } from "@/context/AuthContext";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * A slim, single-line alternative to SessionCard for the curriculum
 * overview — a small thumbnail instead of a full photo, so a whole
 * category's worth of sessions still reads as a scannable list rather than
 * a wall of large cards, while keeping the visual identity a plain text
 * row would lose. Kept as a separate component (not a "compact" prop on
 * SessionCard) since the two show meaningfully different information:
 * SessionCard's full photo/summary suit a single session's own page, not
 * a from-the-top overview of all eight.
 */
export default function SessionListRow({
  session,
  subTopicCount = 0,
  completionPercent,
}: {
  session: Session;
  subTopicCount?: number;
  completionPercent?: number;
}) {
  const { isMember, isReady } = useAuth();
  const locked = !session.isFree && (!isReady || !isMember);

  return (
    <Link
      href={`/sessions/${session.slug}`}
      className="group flex items-center gap-2.5 rounded-lg border border-ink/10 bg-card py-0.5 pl-0.5 pr-3 transition-colors hover:border-teal/40 hover:bg-teal/5 sm:gap-3 sm:pr-4"
    >
      <div className="relative h-7 w-11 shrink-0 overflow-hidden rounded-md sm:h-8 sm:w-12">
        <Image src={session.imageUrl} alt="" fill sizes="48px" className="object-cover" />
        <span className="absolute bottom-0 left-0.5 font-serif text-[9px] leading-none text-porcelain drop-shadow-sm">
          {pad(session.position)}
        </span>
      </div>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-sm text-ink group-hover:text-teal sm:text-base">
          {session.title}
        </span>
      </span>

      {session.duration && (
        <span className="hidden shrink-0 text-xs text-muted sm:inline">
          {session.duration}
        </span>
      )}

      {subTopicCount > 0 && (
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal-dark sm:inline-flex">
          {subTopicCount} sub-topic{subTopicCount > 1 ? "s" : ""}
        </span>
      )}

      {locked ? (
        <span
          aria-label="Members only"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-muted"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" />
          </svg>
          Members
        </span>
      ) : (
        completionPercent !== undefined && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              completionPercent === 100
                ? "bg-teal text-porcelain"
                : completionPercent > 0
                  ? "bg-teal/10 text-teal-dark"
                  : "bg-ink/5 text-muted"
            }`}
          >
            {completionPercent === 100 ? "Done" : `${completionPercent}%`}
          </span>
        )
      )}

      <span
        aria-hidden="true"
        className="shrink-0 text-teal transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
