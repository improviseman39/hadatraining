"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toLocalDatetimeInput } from "@/lib/timezone";

type ActionResult = { error?: string; success?: boolean } | undefined;
type UserOption = { id: string; email: string; group_id: string | null };
type GroupOption = { id: string; name: string };

function UserPicker({
  users,
  groups,
}: {
  users: UserOption[];
  groups: GroupOption[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");

  const groupNameById = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups]);

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) => u.email.toLowerCase().includes(query));
  }, [users, filter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addGroup(groupId: string) {
    if (!groupId) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const u of users) {
        if (u.group_id === groupId) next.add(u.id);
      }
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        Assign to <span className="font-normal text-muted">({selected.size} selected)</span>
      </label>

      {groups.length > 0 && (
        <select
          value=""
          onChange={(e) => addGroup(e.target.value)}
          className="mb-2 w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        >
          <option value="">Quick-select a whole group…</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by email…"
          className="flex-1 rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
        {selected.size > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink hover:border-terracotta hover:text-terracotta"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-ink/15 bg-porcelain p-1.5">
        {filtered.length === 0 && (
          <p className="p-2 text-sm text-muted">No users match &ldquo;{filter}&rdquo;.</p>
        )}
        {filtered.map((u) => (
          <label
            key={u.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-card"
          >
            <input
              type="checkbox"
              name="user_ids"
              value={u.id}
              checked={selected.has(u.id)}
              onChange={() => toggle(u.id)}
              className="h-4 w-4 rounded border-ink/25 text-teal focus:ring-teal/30"
            />
            <span className="min-w-0 flex-1 truncate">{u.email}</span>
            {u.group_id && groupNameById.has(u.group_id) && (
              <span className="shrink-0 rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-medium text-teal-dark">
                {groupNameById.get(u.group_id)}
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function BookingForm({
  action,
  users,
  groups = [],
  sessions,
  defaultValues,
  showUserField,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  users: UserOption[];
  groups?: GroupOption[];
  sessions: { id: string; title: string }[];
  defaultValues?: {
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
      {showUserField && <UserPicker users={users} groups={groups} />}

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
