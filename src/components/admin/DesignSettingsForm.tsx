"use client";

import { useState, useTransition } from "react";
import LogoUploadField from "@/components/admin/LogoUploadField";

type ActionResult = { error?: string; success?: boolean } | undefined;

type SiteSettings = {
  header_title: string;
  header_subtitle: string;
  logo_storage_path: string | null;
  primary_color: string;
  primary_color_dark: string;
  heading_font: "fraunces" | "playfair" | "lora";
  body_font: "inter" | "system";
};

const HEADING_FONTS: { value: SiteSettings["heading_font"]; label: string }[] = [
  { value: "fraunces", label: "Fraunces (current — serif)" },
  { value: "playfair", label: "Playfair Display (serif)" },
  { value: "lora", label: "Lora (serif)" },
];

const BODY_FONTS: { value: SiteSettings["body_font"]; label: string }[] = [
  { value: "inter", label: "Inter (current — sans-serif)" },
  { value: "system", label: "System default (sans-serif)" },
];

export default function DesignSettingsForm({
  action,
  settings,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  settings: SiteSettings;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Header title</label>
          <input
            name="header_title"
            required
            defaultValue={settings.header_title}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Header subtitle</label>
          <input
            name="header_subtitle"
            required
            defaultValue={settings.header_subtitle}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
      </div>

      <LogoUploadField
        defaultStoragePath={settings.logo_storage_path}
        onUploadingChange={setUploading}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Brand color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="primary_color"
              defaultValue={settings.primary_color}
              className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-ink/15 bg-porcelain p-1"
            />
            <span className="text-xs text-muted">
              Used for buttons, links, and accents sitewide.
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Brand color (hover / dark)</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="primary_color_dark"
              defaultValue={settings.primary_color_dark}
              className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-ink/15 bg-porcelain p-1"
            />
            <span className="text-xs text-muted">Shown on hover and for emphasis.</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Heading font</label>
          <select
            name="heading_font"
            defaultValue={settings.heading_font}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            {HEADING_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Body font</label>
          <select
            name="body_font"
            defaultValue={settings.body_font}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            {BODY_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
      {saved && <p className="text-sm font-medium text-teal">Saved — changes are live sitewide now.</p>}

      <button
        type="submit"
        disabled={pending || uploading}
        className="w-fit rounded-full bg-teal px-6 py-2.5 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : uploading ? "Uploading…" : "Save changes"}
      </button>
    </form>
  );
}
