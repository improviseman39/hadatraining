"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { unsplashUrl } from "@/data/sessions";
import { useUnsavedChanges } from "@/components/admin/UnsavedChangesContext";

const CATEGORIES = ["Foundations", "Injectables", "Devices", "Safety"] as const;

type ActionResult = { error?: string; success?: boolean } | undefined;

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
    duration?: string;
    image_id?: string;
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
  const [imageId, setImageId] = useState(defaultValues?.image_id ?? "");
  const [parentId, setParentId] = useState(defaultParentId ?? "");
  const [pending, startTransition] = useTransition();
  const unsaved = useUnsavedChanges();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) setError(result.error);
      else if (result?.success) {
        setSaved(true);
        unsaved?.setDirty("session-details", false);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => unsaved?.setDirty("session-details", true)}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Title</label>
          <input
            name="title"
            required
            defaultValue={defaultValues?.title}
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
            defaultValue={defaultValues?.slug}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
          />
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
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Duration</label>
          <input
            name="duration"
            required
            placeholder="e.g. 45 min"
            defaultValue={defaultValues?.duration}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
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
                {"  ".repeat(opt.depth)}
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
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Unsplash image id
          </label>
          <input
            name="image_id"
            required
            value={imageId}
            onChange={(e) => setImageId(e.target.value)}
            placeholder="e.g. 1512290923902-8a9f81dc236c"
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        {imageId && (
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-ink/10">
            <Image src={unsplashUrl(imageId, 200)} alt="Preview" fill className="object-cover" unoptimized />
          </div>
        )}
      </div>

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
