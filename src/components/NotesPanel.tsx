"use client";

import { useEffect, useRef, useState } from "react";

const SAVE_DELAY_MS = 500;

export default function NotesPanel({ slug }: { slug: string }) {
  const storageKey = `hada_notes_${slug}`;
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const hydrated = useRef(false);

  useEffect(() => {
    setNotes(window.localStorage.getItem(storageKey) ?? "");
    hydrated.current = true;
  }, [storageKey]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setNotes(value);
    if (!hydrated.current) return;

    window.clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      window.localStorage.setItem(storageKey, value);
      setStatus("saved");
    }, SAVE_DELAY_MS);
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg text-ink">My notes</h2>
          <p className="mt-1 text-sm text-muted">
            Private to this browser — jot down what matters as you go.
          </p>
        </div>
        <span
          aria-live="polite"
          className={`shrink-0 text-xs font-medium transition-opacity ${
            status === "saved" ? "text-teal opacity-100" : "opacity-0"
          }`}
        >
          Saved
        </span>
      </div>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="e.g. Remember to review the danger-zone map before the injection points…"
        rows={5}
        className="mt-4 w-full resize-y rounded-lg border border-ink/15 bg-porcelain px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
    </div>
  );
}
