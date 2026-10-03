"use client";

import Image from "next/image";
import Link from "next/link";
import type { Session } from "@/types/content";
import { useAuth } from "@/context/AuthContext";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Large photo card for the tabbed curriculum page (one category's sessions
 * shown at a time) — replaces the old small multi-column SessionGridCard,
 * which this page no longer uses.
 */
export default function SessionTabCard({
  session,
  subTopicCount = 0,
  lessonCount = 0,
  completionPercent,
}: {
  session: Session;
  subTopicCount?: number;
  lessonCount?: number;
  completionPercent?: number;
}) {
  const { isMember, isReady } = useAuth();
  const locked = !session.isFree && (!isReady || !isMember);

  const statusLabel = locked
    ? "Members"
    : completionPercent === 100
      ? "Completed"
      : completionPercent !== undefined && completionPercent > 0
        ? `${completionPercent}% watched`
        : "Not started";

  return (
    <Link
      href={`/sessions/${session.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={session.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 font-serif text-3xl leading-none text-porcelain drop-shadow-sm">
          {pad(session.position)}
        </span>
        <span
          className={`absolute right-4 top-4 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${
            locked
              ? "bg-ink/70 text-porcelain"
              : completionPercent === 100
                ? "bg-teal text-porcelain"
                : "bg-porcelain/90 text-ink"
          }`}
        >
          {locked && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl text-ink group-hover:text-teal">{session.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          {session.duration && <span>{session.duration}</span>}
          {subTopicCount > 0 ? (
            <>
              <span aria-hidden="true">&middot;</span>
              <span>
                {subTopicCount} sub-topic{subTopicCount > 1 ? "s" : ""}
              </span>
            </>
          ) : (
            lessonCount > 0 && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>
                  {lessonCount} lesson{lessonCount > 1 ? "s" : ""}
                </span>
              </>
            )
          )}
        </div>

        <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-sm font-medium text-porcelain transition-colors group-hover:bg-teal-dark">
          Explore
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  );
}
