"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { unsplashUrl } from "@/data/sessions";

const IMAGE_BUCKET = "announcement-images";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export default function AnnouncementImageUploadField({
  defaultStoragePath,
  defaultImageId,
  onUploadingChange,
}: {
  defaultStoragePath?: string | null;
  defaultImageId?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [storagePath, setStoragePath] = useState(defaultStoragePath ?? "");
  const [imageId, setImageId] = useState(defaultImageId ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultStoragePath
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${defaultStoragePath}`
      : defaultImageId
        ? unsplashUrl(defaultImageId, 300)
        : null
  );
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
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 8MB.");
      setStatus("error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setStatus("uploading");
    onUploadingChange?.(true);

    const supabase = createClient();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      setStatus("error");
      onUploadingChange?.(false);
      return;
    }

    setStoragePath(path);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("done");
    onUploadingChange?.(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-4">
        {previewUrl && (
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-porcelain">
            <Image src={previewUrl} alt="" fill unoptimized className="object-cover" />
          </div>
        )}
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-ink">Upload an image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={status === "uploading"}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-teal file:px-3 file:py-1 file:text-xs file:font-medium file:text-porcelain focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
          />
          <input type="hidden" name="image_storage_path" value={storagePath} />
          {status === "uploading" && <p className="mt-1 text-xs text-muted">Uploading…</p>}
          {status === "done" && <p className="mt-1 text-xs text-teal">Uploaded.</p>}
          {error && <p className="mt-1 text-xs font-medium text-terracotta">{error}</p>}
          <p className="mt-1 text-xs text-muted">
            Any size or shape works — it&apos;s automatically cropped to fit wherever it&apos;s shown.
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink">
          …or use an Unsplash photo id instead
        </label>
        <input
          name="image_id"
          value={imageId}
          onChange={(event) => {
            setImageId(event.target.value);
            setStoragePath("");
            setPreviewUrl(event.target.value ? unsplashUrl(event.target.value, 300) : null);
          }}
          placeholder="e.g. 1512290923902-8a9f81dc236c"
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>
    </div>
  );
}
