"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRequestWidget } from "@/context/RequestWidgetContext";
import { createClient } from "@/lib/supabase/client";
import { mapQaEntry } from "@/lib/supabase/mappers";
import type { QaEntry } from "@/types/content";
import { submitRequest, sendRequestMessage } from "@/lib/actions/requests";

const QA_STOPWORDS = new Set([
  "what",
  "when",
  "where",
  "which",
  "how",
  "does",
  "have",
  "your",
  "with",
  "that",
  "this",
  "about",
  "please",
  "would",
  "could",
  "should",
  "need",
  "want",
  "help",
  "thanks",
  "thank",
]);

type ThreadMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type Thread = {
  id: string;
  message: string;
  status: "new" | "resolved";
  created_at: string;
  replies: ThreadMessage[];
};

export default function RequestWidget() {
  const { user, isMember, isReady } = useAuth();
  const { open, closeWidget, toggleWidget } = useRequestWidget();
  const [mode, setMode] = useState<"loading" | "thread" | "compose">("compose");
  const [thread, setThread] = useState<Thread | null>(null);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [qaEntries, setQaEntries] = useState<QaEntry[] | null>(null);
  const [expandedQaId, setExpandedQaId] = useState<string | null>(null);
  const [qaDismissed, setQaDismissed] = useState(false);

  useEffect(() => {
    if (!open || qaEntries !== null) return;
    const supabase = createClient();
    supabase
      .from("qa_entries")
      .select("*")
      .order("position")
      .then(({ data }) => {
        setQaEntries((data ?? []).map(mapQaEntry));
      });
  }, [open, qaEntries]);

  // Matches the member's own message text — same box they'd use to ask
  // staff directly, no separate search field to type into twice. A plain
  // substring check doesn't work here since the message is a full
  // sentence and the Q&A question is short - instead score by how many
  // meaningful words the two share.
  const qaMatches = useMemo(() => {
    const messageWords = new Set(
      (message.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
        (word) => word.length >= 4 && !QA_STOPWORDS.has(word)
      )
    );
    if (messageWords.size === 0 || !qaEntries) return [];

    const scored = qaEntries
      .map((entry) => {
        const entryWords = (entry.question + " " + entry.answer)
          .toLowerCase()
          .match(/[a-z0-9]+/g) ?? [];
        const entryWordSet = new Set(entryWords);
        let score = 0;
        for (const word of messageWords) {
          if (entryWordSet.has(word)) score += 1;
        }
        return { entry, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 3).map((item) => item.entry);
  }, [message, qaEntries]);

  function handleMessageChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setMessage(value);
    if (value.trim().length < 3) setQaDismissed(false);
  }

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setMode("loading");

    async function loadThread() {
      const supabase = createClient();
      const { data: latest } = await supabase
        .from("requests")
        .select("id, message, status, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (!latest) {
        setMode("compose");
        return;
      }

      const { data: replies } = await supabase
        .from("request_messages")
        .select("id, sender_id, body, created_at")
        .eq("request_id", latest.id)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      setThread({ ...latest, replies: replies ?? [] });
      setMode("thread");
    }

    loadThread();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  if (!isReady || !isMember) return null;

  function handleCompose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("message", message);
    setError(null);

    startTransition(async () => {
      const result = await submitRequest(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("");
      setQaDismissed(false);
      setExpandedQaId(null);

      if (!user) return;
      const supabase = createClient();
      const { data: latest } = await supabase
        .from("requests")
        .select("id, message, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest) setThread({ ...latest, replies: [] });
      setMode("thread");
    });
  }

  function handleReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!thread) return;
    const formData = new FormData();
    formData.set("body", reply);
    setError(null);

    startTransition(async () => {
      const result = await sendRequestMessage(thread.id, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setReply("");
      const supabase = createClient();
      const { data: replies } = await supabase
        .from("request_messages")
        .select("id, sender_id, body, created_at")
        .eq("request_id", thread.id)
        .order("created_at", { ascending: true });
      setThread((current) => (current ? { ...current, replies: replies ?? [], status: "new" } : current));
    });
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex max-h-[70vh] w-80 max-w-[calc(100vw-3rem)] flex-col rounded-2xl border border-ink/10 bg-card p-5 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-base text-ink">Contact us</h2>
            <button
              type="button"
              onClick={closeWidget}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <Link
            href="/qa"
            onClick={closeWidget}
            className="mt-1 text-xs font-medium text-teal underline-offset-2 hover:underline"
          >
            Browse all Q&amp;A &rarr;
          </Link>

          {mode === "loading" && (
            <p className="mt-4 text-sm text-muted">Loading…</p>
          )}

          {mode === "thread" && thread && (
            <div className="mt-3 flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink">You</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        thread.status === "new" ? "bg-teal/10 text-teal" : "bg-porcelain text-muted"
                      }`}
                    >
                      {thread.status === "new" ? "Awaiting reply" : "Resolved"}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">{thread.message}</p>
                </div>

                {thread.replies.map((r) => (
                  <div key={r.id} className="mt-3 border-t border-ink/10 pt-3 text-sm">
                    <span className="font-medium text-ink">
                      {r.sender_id === user?.id ? "You" : "HADA team"}
                    </span>
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">{r.body}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setThread(null);
                  setMode("compose");
                  setError(null);
                }}
                className="mt-3 self-start text-xs font-medium text-teal underline-offset-2 hover:underline"
              >
                Start a new request
              </button>

              <form onSubmit={handleReply} className="mt-3 border-t border-ink/10 pt-3">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Reply…"
                  rows={2}
                  required
                  disabled={pending}
                  className="w-full resize-y rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
                {error && (
                  <p role="alert" className="mt-2 text-sm font-medium text-terracotta">
                    {error}
                  </p>
                )}
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={pending}
                    className="shrink-0 rounded-full bg-teal px-5 py-2 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark disabled:opacity-70"
                  >
                    {pending ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {mode === "compose" && (
            <form onSubmit={handleCompose} className="mt-3">
              <textarea
                value={message}
                onChange={handleMessageChange}
                placeholder="What do you need help with?"
                rows={4}
                required
                disabled={pending}
                className="w-full resize-y rounded-lg border border-ink/15 bg-porcelain px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />

              {!qaDismissed && qaMatches.length > 0 && (
                <div className="mt-2 rounded-lg border border-teal/20 bg-teal/5 p-3">
                  <p className="text-xs font-medium text-ink">
                    This looks like something we&apos;ve already answered:
                  </p>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {qaMatches.map((entry) => {
                      const isExpanded = expandedQaId === entry.id;
                      return (
                        <div key={entry.id}>
                          <button
                            type="button"
                            onClick={() => setExpandedQaId(isExpanded ? null : entry.id)}
                            aria-expanded={isExpanded}
                            className="flex w-full items-start justify-between gap-2 text-left text-xs font-medium text-teal-dark"
                          >
                            <span>{entry.question}</span>
                            <span aria-hidden="true" className="shrink-0 text-teal">
                              {isExpanded ? "−" : "+"}
                            </span>
                          </button>
                          {isExpanded && (
                            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-ink/70">
                              {entry.answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQaDismissed(true)}
                    className="mt-2 text-xs font-medium text-muted underline-offset-2 hover:underline"
                  >
                    Not this — keep asking us directly
                  </button>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-2 text-sm font-medium text-terracotta">
                  {error}
                </p>
              )}
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={pending}
                  className="shrink-0 rounded-full bg-teal px-5 py-2 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark disabled:opacity-70"
                >
                  {pending ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={toggleWidget}
        aria-label={open ? "Close contact form" : "Contact us"}
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full bg-teal text-porcelain shadow-lg transition-colors hover:bg-teal-dark ${
          open ? "h-12 w-12 justify-center" : "h-12 pl-4 pr-5"
        }`}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-medium">Contact us</span>
          </>
        )}
      </button>
    </div>
  );
}
