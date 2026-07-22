"use client";

import { useState, useTransition } from "react";
import AnnouncementImageUploadField from "@/components/admin/AnnouncementImageUploadField";
import VimeoUploadField from "@/components/admin/VimeoUploadField";

const CATEGORIES = ["Seminar", "News", "Event"] as const;

type ActionResult = { error?: string; success?: boolean } | undefined;

export default function AnnouncementForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  defaultValues?: {
    title?: string;
    category?: string;
    description?: string;
    date?: string;
    image_id?: string | null;
    image_storage_path?: string | null;
    video_url?: string | null;
    href?: string | null;
  };
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const uploading = imageUploading || videoUploading;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Title</label>
        <input
          name="title"
          required
          defaultValue={defaultValues?.title}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
          <label className="mb-1.5 block text-sm font-medium text-ink">Date</label>
          <input
            type="date"
            name="date"
            required
            defaultValue={defaultValues?.date}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={defaultValues?.description}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Link (optional — e.g. /sessions/ha-filler)
        </label>
        <input
          name="href"
          defaultValue={defaultValues?.href ?? ""}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      <AnnouncementImageUploadField
        defaultStoragePath={defaultValues?.image_storage_path}
        defaultImageId={defaultValues?.image_id ?? undefined}
        onUploadingChange={setImageUploading}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Video (optional)
        </label>
        <VimeoUploadField
          defaultValue={defaultValues?.video_url}
          onUploadingChange={setVideoUploading}
        />
        <p className="mt-1 text-xs text-muted">If set, this plays instead of the image above.</p>
      </div>

      {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
      {saved && <p className="text-sm font-medium text-teal">Saved.</p>}
      {uploading && (
        <p className="text-xs font-medium text-muted">
          Wait for the upload to finish before saving — the button is disabled until then.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="w-fit rounded-full bg-teal px-6 py-2.5 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
