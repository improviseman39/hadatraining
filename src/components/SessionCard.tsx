"use client";

import Image from "next/image";
import Link from "next/link";
import type { Session } from "@/types/content";
import { unsplashUrl } from "@/data/sessions";
import { useAuth } from "@/context/AuthContext";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function SessionCard({ session }: { session: Session }) {
  const { isMember, isReady } = useAuth();
  const locked = !session.isFree && (!isReady || !isMember);

  return (
    <Link
      href={`/sessions/${session.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md motion-reduce:transform-none"
    >
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          src={unsplashUrl(session.imageId, 700)}
          alt=""
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <span className="absolute left-4 top-4 font-serif text-3xl leading-none text-porcelain drop-shadow-sm">
          {pad(session.position)}
        </span>
        {locked && (
          <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-porcelain backdrop-blur-sm">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" />
            </svg>
            Members
          </span>
        )}
        <span className="absolute bottom-4 left-4 rounded-full border border-porcelain/40 bg-ink/40 px-3 py-1 text-xs font-medium text-porcelain backdrop-blur-sm">
          {session.duration}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-serif text-xl font-medium text-ink sm:text-2xl">
          {session.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {session.summary}
        </p>

        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-teal">
          <span>{locked ? "Unlock this session" : "View session"}</span>
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
          >
            &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
