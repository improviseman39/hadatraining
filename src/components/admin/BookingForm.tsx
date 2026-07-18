"use client";

import { useEffect, useState, useTransition } from "react";
import { toLocalDatetimeInput } from "@/lib/timezone";

type ActionResult = { error?: string; success?: boolean } | undefined;

export default function BookingForm({
  action,
  users,
  sessions,
  defaultValues,
  showUserField,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  users: { id: string; email: string }[];
  sessions: { id: string; title: string }[];
  defaultValues?: {
    user_id?: string;
    session_id?: string;
    /** Raw UTC ISO timestamps — converted to the viewer's local time client-side. */
    start_at?: string;
    end_at?: string;
    notes?: string | null;
  };
  showUserField: boolean;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  // Computed after mount (not during SSR) so this reflects the viewer's own
  // browser timezone rather than the server process's.
  useEffect(() => {
    if (defaultValues?.start_at) {
      setStartLocal(toLocalDatetimeInput(new Date(defaultValues.start_at)));
    }
    if (defaultValues?.end_at) {
      setEndLocal(toLocalDatetimeInput(new Date(defaultValues.end_at)));
    }
  }, [defaultValues?.start_at, defaultValues?.end_at]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("tz_offset_minutes", String(new Date().getTimezoneOffset()));
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) setError(result.error);
      else if (result?.success) setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {showUserField && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">User</label>
          <select
            name="user_id"
            required
            defaultValue={defaultValues?.user_id}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="" disabled>
              Select a user
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Topic</label>
        <select
          name="session_id"
          required
          defaultValue={defaultValues?.session_id}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        >
          <option value="" disabled>
            Select a curriculum session
          </option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Start (your local time)
          </label>
          <input
            type="datetime-local"
            name="start_at"
            required
            value={startLocal}
            onChange={(event) => setStartLocal(event.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            End (your local time)
          </label>
          <input
            type="datetime-local"
            name="end_at"
            required
            value={endLocal}
            onChange={(event) => setEndLocal(event.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Notes (optional)
        </label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="e.g. Bring your own model"
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
      {saved && <p className="text-sm font-medium text-teal">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-teal px-6 py-2.5 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
