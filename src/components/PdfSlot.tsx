"use client";

import ExpandButton from "@/components/ExpandButton";
import { useExpandable } from "@/hooks/useExpandable";

type PdfSlotProps = {
  hasPdf: boolean;
  pdfUrl: string | null;
  title: string;
};

/** Hides the browser's built-in PDF toolbar/download button where supported (Chromium, partial Firefox). */
function viewOnlyUrl(pdfUrl: string): string {
  return `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`;
}

export default function PdfSlot({ hasPdf, pdfUrl, title }: PdfSlotProps) {
  const { expanded, toggle } = useExpandable();

  if (hasPdf && pdfUrl) {
    return (
      <div
        className={
          expanded
            ? "fixed inset-0 z-50 flex flex-col bg-ink p-4 sm:p-6"
            : "relative flex h-[520px] w-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-sm sm:h-[75vh]"
        }
      >
        <div className="flex items-center justify-between border-b border-ink/10 bg-card px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-teal/10 text-teal"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.75" />
                <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.75" />
              </svg>
            </span>
            <p className="text-sm font-medium text-ink">Session handout</p>
            <span className="rounded-full border border-ink/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              View only
            </span>
          </div>
          <ExpandButton expanded={expanded} onClick={toggle} label="material" />
        </div>
        <div
          className="relative min-h-0 flex-1 bg-ink/[0.03]"
          onContextMenu={(event) => event.preventDefault()}
        >
          <iframe
            src={viewOnlyUrl(pdfUrl)}
            title={`${title} — session handout`}
            className="h-full w-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed border-ink/20 bg-ink/[0.03] p-6">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 text-muted"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
      <div>
        <p className="font-medium text-ink">PDF not yet uploaded</p>
        <p className="text-sm text-muted">
          This session&apos;s handout will appear here, viewable inline, once
          it&apos;s published.
        </p>
      </div>
    </div>
  );
}
