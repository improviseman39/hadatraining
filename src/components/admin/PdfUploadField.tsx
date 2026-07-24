"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PDF_BUCKET = "session-pdfs";
const MAX_PDF_BYTES = 50 * 1024 * 1024;

export default function PdfUploadField({
  defaultStoragePath,
  defaultUrl,
  onUploadingChange,
}: {
  defaultStoragePath?: string | null;
  defaultUrl?: string | null;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [storagePath, setStoragePath] = useState(defaultStoragePath ?? "");
  const [pdfUrl, setPdfUrl] = useState(defaultUrl ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.type !== "application/pdf") {
      setError("File must be a PDF.");
      setStatus("error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError("PDF must be under 50MB.");
      setStatus("error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setStatus("uploading");
    onUploadingChange?.(true);

    // Uploaded straight from the browser to Storage, bypassing our own
    // server — Vercel's serverless functions cap request bodies around
    // 4.5MB regardless of any Next.js config, so a real PDF handout has to
    // skip our server entirely, the same way video uploads skip it for Vimeo.
    const supabase = createClient();
    const path = `${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(PDF_BUCKET)
      .upload(path, file, { contentType: "application/pdf" });

    if (uploadError) {
      setError(uploadError.message);
      setStatus("error");
      onUploadingChange?.(false);
      return;
    }

    setStoragePath(path);
    setPdfUrl("");
    setStatus("done");
    onUploadingChange?.(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink">Upload a PDF</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={status === "uploading"}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-teal file:px-3 file:py-1 file:text-xs file:font-medium file:text-porcelain focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
        />
        <input type="hidden" name="pdf_storage_path" value={storagePath} />
        {status === "uploading" && <p className="mt-1 text-xs text-muted">Uploading…</p>}
        {status === "done" && <p className="mt-1 text-xs text-teal">Uploaded.</p>}
        {error && <p className="mt-1 text-xs font-medium text-terracotta">{error}</p>}
        {!error && storagePath && status !== "uploading" && (
          <p className="mt-1 text-xs text-muted">A file is already uploaded — choosing a new one replaces it.</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink">
          …or paste an already-hosted link instead
        </label>
        <input
          name="pdf_url"
          value={pdfUrl}
          onChange={(event) => {
            setPdfUrl(event.target.value);
            setStoragePath("");
          }}
          placeholder="https://…"
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>
    </div>
  );
}
