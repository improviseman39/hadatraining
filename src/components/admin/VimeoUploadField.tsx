"use client";

import { useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { createVimeoUploadTicket } from "@/lib/actions/vimeo";

export default function VimeoUploadField({
  defaultValue,
  onUploaded,
}: {
  defaultValue?: string | null;
  onUploaded?: (playerUrl: string) => void;
}) {
  const [videoUrl, setVideoUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setStatus("uploading");
    setProgress(0);

    const ticket = await createVimeoUploadTicket(file.name, file.size);
    if ("error" in ticket) {
      setError(ticket.error);
      setStatus("error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const upload = new Upload(file, {
      uploadUrl: ticket.uploadLink,
      retryDelays: [0, 1000, 3000, 5000],
      onError: () => {
        setError("Upload failed partway through. Try again.");
        setStatus("error");
      },
      onProgress: (bytesSent, bytesTotal) => {
        setProgress(Math.round((bytesSent / bytesTotal) * 100));
      },
      onSuccess: () => {
        setVideoUrl(ticket.playerUrl);
        onUploaded?.(ticket.playerUrl);
        setStatus("done");
      },
    });
    upload.start();
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink">Upload a video</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={status === "uploading"}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-teal file:px-3 file:py-1 file:text-xs file:font-medium file:text-porcelain focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
        />
        {status === "uploading" && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-teal transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {status === "uploading" && (
          <p className="mt-1 text-xs text-muted">Uploading… {progress}% — keep this tab open.</p>
        )}
        {status === "done" && <p className="mt-1 text-xs text-teal">Uploaded — saved to Vimeo.</p>}
        {error && <p className="mt-1 text-xs font-medium text-terracotta">{error}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink">
          …or paste an already-hosted Vimeo player link instead
        </label>
        <input
          name="video_url"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          placeholder="https://player.vimeo.com/video/…"
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>
    </div>
  );
}
