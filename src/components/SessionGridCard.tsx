"use client";

import Image from "next/image";
import Link from "next/link";
import type { Session } from "@/types/content";
import { useAuth } from "@/context/AuthContext";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * A small photo-card, several of which stack inside one category's column
 * on the curriculum overview - as opposed to SessionCard's much larger
 * version used when browsing a single category's own page.
 */
export default function SessionGridCard({
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
      className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-card transition-colors hover:border-teal/40 hover:bg-teal/5"
    >
      <div className="relative h-16 w-full shrink-0 overflow-hidden">
        <Image
          src={session.imageUrl}
          alt=""
          fill
          sizes="(min-width: 640px) 25vw, 50vw"
          className="object-cover"
        />
        <span className="absolute bottom-0.5 left-1.5 font-serif text-xs leading-none text-porcelain drop-shadow-sm">
          {pad(session.position)}
        </span>
        {locked && (
          <span
            aria-label="Members only"
            className="absolute right-1 top-1 flex items-center rounded-full bg-ink/70 p-1 text-porcelain backdrop-blur-sm"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
        )}
        {!locked && completionPercent === 100 && (
          <span
            aria-label="Completed"
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal text-porcelain"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
        {/* A video-style progress bar along the image's bottom edge - the
            same "how far into this lesson am I" cue as a seek bar, so the
            percent badge below reads as lesson progress at a glance. */}
        {!locked && completionPercent !== undefined && completionPercent > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-ink/30">
            <div className="h-full bg-teal" style={{ width: `${completionPercent}%` }} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-1.5">
        <span className="truncate font-serif text-sm text-ink group-hover:text-teal">
          {session.title}
        </span>
        <div className="flex items-center gap-1.5">
          {session.duration && (
            <span className="text-[10px] text-muted">{session.duration}</span>
          )}
          {subTopicCount > 0 && (
            <span className="text-[10px] text-teal-dark">
              {subTopicCount} sub-topic{subTopicCount > 1 ? "s" : ""}
            </span>
          )}
          {!locked && completionPercent !== undefined && (
            <span
              className={`ml-auto whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                completionPercent === 100
                  ? "bg-teal/10 text-teal-dark"
                  : completionPercent > 0
                    ? "bg-teal/10 text-teal-dark"
                    : "bg-ink/5 text-muted"
              }`}
            >
              {completionPercent === 100
                ? "Completed"
                : completionPercent > 0
                  ? `${completionPercent}% watched`
                  : "Not started"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
