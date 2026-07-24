"use client";

import { useState, useTransition } from "react";
import SessionImageUploadField from "@/components/admin/SessionImageUploadField";
import { useUnsavedChanges } from "@/components/admin/UnsavedChangesContext";

const CATEGORIES = ["Foundations", "Injectables", "Devices", "Safety"] as const;

type ActionResult = { error?: string; success?: boolean } | undefined;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SessionForm({
  action,
  defaultValues,
  submitLabel,
  lockSlug,
  parentOptions,
  defaultParentId,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  defaultValues?: {
    slug?: string;
    title?: string;
    category?: string;
    summary?: string;
    duration?: string | null;
    image_id?: string | null;
    image_storage_path?: string | null;
    is_free?: boolean;
  };
  submitLabel: string;
  lockSlug?: boolean;
  /** Depth-first, already-indentable list for the "Parent session" selector. */
  parentOptions?: { id: string; title: string; depth: number }[];
  defaultParentId?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [slugEditedByHand, setSlugEditedByHand] = useState(lockSlug ?? false);
  const [parentId, setParentId] = useState(defaultParentId ?? "");
  const [pending, startTransition] = useTransition();
  const unsaved = useUnsavedChanges();

  function markDirty() {
    setDirty(true);
    setSaved(false);
    unsaved?.setDirty("session-details", true);
  }

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEditedByHand) setSlug(slugify(event.target.value));
  }

  function handleSlugChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSlugEditedByHand(true);
    setSlug(event.target.value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) setError(result.error);
      else if (result?.success) {
        setSaved(true);
        setDirty(false);
        unsaved?.setDirty("session-details", false);
      }
    });
  }

  const buttonLabel = pending ? "Saving…" : saved && !dirty ? "Saved ✓" : submitLabel;

  return (
    <form onSubmit={handleSubmit} onChange={markDirty} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Title</label>
          <input
            name="title"
            required
            defaultValue={defaultValues?.title}
            onChange={handleTitleChange}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Slug {lockSlug && <span className="text-muted">(locked after creation)</span>}
          </label>
          <input
            name="slug"
            required
            disabled={lockSlug}
            value={slug}
            onChange={handleSlugChange}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-muted">
            {lockSlug
              ? "The web address for this session's page — locked now so existing links keep working."
              : "The web address for this session's page (e.g. hadatraining.com/sessions/facial-anatomy). Auto-filled from the title — edit it if you'd like something shorter."}
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
          <select
            name="category"
            required
            defaultValue={defaultValues?.category}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="" disabled>
              Select a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">Which group this session is filed under on the curriculum page.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Duration <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            name="duration"
            placeholder="e.g. 45 min"
            defaultValue={defaultValues?.duration ?? ""}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
          <p className="mt-1 text-xs text-muted">
            Shown as a small badge on the card and session page. Leave blank to hide it.
          </p>
        </div>
      </div>

      {parentOptions && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Parent session <span className="font-normal text-muted">(optional — leave blank for a top-level session)</span>
          </label>
          <select
            name="parent_id"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="">— None (top-level) —</option>
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {"  ".repeat(opt.depth)}
                {opt.depth > 0 ? "↳ " : ""}
                {opt.title}
              </option>
            ))}
          </select>
          {parentId && (
            <p className="mt-1 text-xs text-muted">
              A sub-topic isn&apos;t shown on the homepage curriculum grid — it&apos;s found by browsing
              into its parent session&apos;s page. It also shares its parent&apos;s free/members-only
              access automatically.
            </p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Summary</label>
        <textarea
          name="summary"
          required
          rows={3}
          defaultValue={defaultValues?.summary}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
        <p className="mt-1 text-xs text-muted">
          The short description shown on the curriculum card and under the title on the session page.
        </p>
      </div>

      <SessionImageUploadField
        defaultStoragePath={defaultValues?.image_storage_path}
        defaultImageId={defaultValues?.image_id}
      />

      {!parentId && (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="is_free"
            defaultChecked={defaultValues?.is_free}
            className="h-4 w-4 rounded border-ink/25 text-teal focus:ring-teal/30"
          />
          Free session (visible without membership)
        </label>
      )}

      <div className="sticky bottom-4 z-10 -mx-6 mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 bg-card/95 px-6 py-3 shadow-lg backdrop-blur sm:-mx-7 sm:px-7">
        <button
          type="submit"
          disabled={pending || !dirty}
          className="w-fit rounded-full bg-teal px-6 py-2.5 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:bg-ink/20 disabled:text-muted"
        >
          {buttonLabel}
        </button>
        {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
        {!error && !dirty && !saved && (
          <p className="text-xs text-muted">No changes yet — edit a field above to enable saving.</p>
        )}
        {!error && !dirty && saved && (
          <p className="text-xs text-muted">Everything here is saved.</p>
        )}
      </div>
    </form>
  );
}
