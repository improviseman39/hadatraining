"use client";

import { useState, useTransition } from "react";
import { createGroup, deleteGroup, renameGroup } from "@/app/admin/users/actions";

type Group = { id: string; name: string; memberCount: number };

function GroupRow({ group }: { group: Group }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await renameGroup(group.id, formData);
      if (result?.error) setError(result.error);
      else setEditing(false);
    });
  }

  function handleDelete() {
    const warning =
      group.memberCount > 0
        ? `Delete "${group.name}"? Its ${group.memberCount} member${group.memberCount > 1 ? "s" : ""} won't be removed, just ungrouped.`
        : `Delete "${group.name}"?`;
    if (!window.confirm(warning)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteGroup(group.id);
      if (result?.error) setError(result.error);
    });
  }

  if (editing) {
    return (
      <li>
        <form onSubmit={handleRename} className="flex items-center gap-2">
          <input
            name="name"
            required
            defaultValue={group.name}
            autoFocus
            className="flex-1 rounded-lg border border-ink/15 bg-porcelain px-2.5 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-teal px-3 py-1 text-xs font-medium text-porcelain hover:bg-teal-dark disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink hover:border-teal"
          >
            Cancel
          </button>
        </form>
        {error && <p className="mt-1 text-xs font-medium text-terracotta">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 hover:bg-porcelain">
      <span className="text-sm text-ink">
        {group.name}{" "}
        <span className="text-xs text-muted">
          · {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
        </span>
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink hover:border-teal hover:text-teal"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-terracotta hover:border-terracotta disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      {error && <p className="mt-1 text-xs font-medium text-terracotta">{error}</p>}
    </li>
  );
}

function NewGroupForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await createGroup(formData);
      if (result?.error) setError(result.error);
      else form.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        name="name"
        required
        placeholder="e.g. HADA class 2026 July"
        className="flex-1 rounded-lg border border-ink/15 bg-porcelain px-2.5 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-porcelain hover:bg-teal disabled:opacity-60"
      >
        {pending ? "Adding…" : "+ New group"}
      </button>
      {error && <p className="text-xs font-medium text-terracotta">{error}</p>}
    </form>
  );
}

export default function GroupsPanel({ groups }: { groups: Group[] }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-muted">
        Groups
      </p>
      <p className="mb-4 text-xs text-muted">
        A cohort like &ldquo;HADA class 2026 July&rdquo; — assign users to a group below, then
        pick that group when creating a booking to add it to everyone at once.
      </p>
      {groups.length > 0 && (
        <ul className="mb-4 flex flex-col gap-1">
          {groups.map((group) => (
            <GroupRow key={group.id} group={group} />
          ))}
        </ul>
      )}
      <NewGroupForm />
    </div>
  );
}
