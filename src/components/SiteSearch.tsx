"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

type SessionResult = {
  slug: string;
  title: string;
  summary: string;
  is_free: boolean;
  parent_id: string | null;
  parentTitle?: string;
};

type AnnouncementResult = {
  id: string;
  title: string;
  description: string;
  href: string | null;
};

const DEBOUNCE_MS = 250;

export default function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isMember, isReady } = useAuth();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSessions([]);
      setAnnouncements([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      const supabase = createClient();
      const escaped = trimmed.replace(/[%_]/g, "\\$&");

      const [{ data: sessionRows }, { data: announcementRows }] = await Promise.all([
        supabase
          .from("sessions")
          .select("slug, title, summary, is_free, parent_id")
          .or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%`)
          .limit(8),
        supabase
          .from("announcements")
          .select("id, title, description, href")
          .or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
          .limit(5),
      ]);
      if (cancelled) return;

      const results = sessionRows ?? [];
      const parentIds = [...new Set(results.map((s) => s.parent_id).filter(Boolean))] as string[];
      let parentTitleById = new Map<string, string>();
      if (parentIds.length > 0) {
        const { data: parents } = await supabase.from("sessions").select("id, title").in("id", parentIds);
        parentTitleById = new Map((parents ?? []).map((p) => [p.id, p.title]));
      }

      if (cancelled) return;
      setSessions(
        results.map((s) => ({
          ...s,
          parentTitle: s.parent_id ? parentTitleById.get(s.parent_id) : undefined,
        }))
      );
      setAnnouncements(announcementRows ?? []);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  const hasQuery = query.trim().length >= 2;
  const hasResults = sessions.length > 0 || announcements.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-24 backdrop-blur-sm"
          onClick={close}
        >
          <div
            role="dialog"
            aria-label="Search"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0 text-muted">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sessions and updates…"
                className="w-full bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-muted hover:text-ink"
              >
                Esc
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!hasQuery && (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  Type at least 2 characters to search.
                </p>
              )}
              {hasQuery && loading && (
                <p className="px-3 py-6 text-center text-sm text-muted">Searching…</p>
              )}
              {hasQuery && !loading && !hasResults && (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  No results for &ldquo;{query}&rdquo;.
                </p>
              )}

              {sessions.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                    Sessions
                  </p>
                  {sessions.map((session) => {
                    const locked = !session.is_free && (!isReady || !isMember);
                    return (
                      <Link
                        key={session.slug}
                        href={`/sessions/${session.slug}`}
                        onClick={close}
                        className="flex items-start gap-2 rounded-lg px-3 py-2.5 hover:bg-porcelain"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-ink">{session.title}</p>
                            {locked && (
                              <span className="shrink-0 rounded-full bg-terracotta/10 px-2 py-0.5 text-[10px] font-medium text-terracotta">
                                Members
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted">
                            {session.parentTitle ? `In ${session.parentTitle} — ` : ""}
                            {session.summary}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {announcements.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                    Updates
                  </p>
                  {announcements.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href || "/#updates"}
                      onClick={close}
                      className="flex items-start gap-2 rounded-lg px-3 py-2.5 hover:bg-porcelain"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                        <p className="truncate text-xs text-muted">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
