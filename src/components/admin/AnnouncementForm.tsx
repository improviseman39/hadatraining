"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { unsplashUrl } from "@/data/sessions";

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
    image_id?: string;
    href?: string | null;
  };
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [imageId, setImageId] = useState(defaultValues?.image_id ?? "");
  const [pending, startTransition] = useTransition();

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
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        {imageId && (
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-ink/10">
            <Image src={unsplashUrl(imageId, 200)} alt="Preview" fill className="object-cover" unoptimized />
          </div>
        )}
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
