"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRequestWidget } from "@/context/RequestWidgetContext";
import { createClient } from "@/lib/supabase/client";
import { submitRequest, sendRequestMessage } from "@/lib/actions/requests";

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
            Check our Q&amp;A first &rarr;
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
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What do you need help with?"
                rows={4}
                required
                disabled={pending}
                className="w-full resize-y rounded-lg border border-ink/15 bg-porcelain px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
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
