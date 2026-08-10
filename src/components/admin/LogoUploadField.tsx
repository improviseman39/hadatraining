"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const LOGO_BUCKET = "branding-images";
const MAX_LOGO_BYTES = 4 * 1024 * 1024;

export default function LogoUploadField({
  defaultStoragePath,
  onUploadingChange,
}: {
  defaultStoragePath?: string | null;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [storagePath, setStoragePath] = useState(defaultStoragePath ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultStoragePath
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${LOGO_BUCKET}/${defaultStoragePath}`
      : null
  );
  const [removeLogo, setRemoveLogo] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("File must be an image.");
      setStatus("error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("Image must be under 4MB.");
      setStatus("error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setStatus("uploading");
    onUploadingChange?.(true);

    const supabase = createClient();
    const extension = file.name.split(".").pop() || "png";
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      setStatus("error");
      onUploadingChange?.(false);
      return;
    }

    setStoragePath(path);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveLogo(false);
    setStatus("done");
    onUploadingChange?.(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-4">
        {previewUrl && !removeLogo && (
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-porcelain">
            <Image src={previewUrl} alt="" fill unoptimized className="object-contain p-1.5" />
          </div>
        )}
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-ink">Logo image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={status === "uploading"}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-teal file:px-3 file:py-1 file:text-xs file:font-medium file:text-porcelain focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
          />
          <input type="hidden" name="logo_storage_path" value={storagePath} />
          {status === "uploading" && <p className="mt-1 text-xs text-muted">Uploading…</p>}
          {status === "done" && <p className="mt-1 text-xs text-teal">Uploaded.</p>}
          {error && <p className="mt-1 text-xs font-medium text-terracotta">{error}</p>}
          <p className="mt-1 text-xs text-muted">
            A wide, transparent-background PNG or SVG works best. Leave empty to keep showing the
            text wordmark instead.
          </p>
          {previewUrl && (
            <label className="mt-2 flex items-center gap-1.5 text-xs text-ink">
              <input
                type="checkbox"
                name="remove_logo"
                checked={removeLogo}
                onChange={(event) => setRemoveLogo(event.target.checked)}
              />
              Remove current logo (go back to text wordmark)
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
