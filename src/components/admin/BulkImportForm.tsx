"use client";

import { useMemo, useRef, useState } from "react";
import { bulkInviteUsers, type BulkInviteRowResult } from "@/app/admin/users/actions";

const BATCH_SIZE = 20;
// A short pause between batches keeps this gentle on Supabase's own
// per-project auth-email abuse protection when sending thousands in a row.
const BATCH_DELAY_MS = 500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pulls one email address out of a line, whether it's bare or "email,name" / "email\tname" / "name,email". */
function extractEmail(line: string): string | null {
  const parts = line.split(/[,\t]/).map((p) => p.trim().replace(/^"|"$/g, ""));
  return parts.find((p) => EMAIL_RE.test(p)) ?? null;
}

function parseEmails(raw: string): { emails: string[]; skipped: number } {
  const seen = new Set<string>();
  const emails: string[] = [];
  let skipped = 0;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const email = extractEmail(trimmed)?.toLowerCase();
    if (!email) {
      skipped++;
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }

  return { emails, skipped };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function BulkImportForm() {
  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [results, setResults] = useState<BulkInviteRowResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { emails, skipped } = useMemo(() => parseEmails(raw), [raw]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRaw(text);
  }

  async function startImport() {
    setError(null);
    setResults([]);
    setStatus("running");
    setProgress({ done: 0, total: emails.length });

    const allResults: BulkInviteRowResult[] = [];
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const response = await bulkInviteUsers(batch);
      if ("error" in response) {
        setError(response.error);
        setStatus("done");
        setResults(allResults);
        return;
      }
      allResults.push(...response.results);
      setResults([...allResults]);
      setProgress({ done: allResults.length, total: emails.length });
      if (i + BATCH_SIZE < emails.length) await sleep(BATCH_DELAY_MS);
    }

    setStatus("done");
  }

  const invited = results.filter((r) => r.status === "invited").length;
  const alreadyExisted = results.filter((r) => r.status === "already_exists").length;
  const failed = results.filter((r) => r.status === "error");

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-ink/10 bg-card p-6 shadow-sm">
      <div className="rounded-xl border border-terracotta/30 bg-terracotta/5 p-4 text-sm text-ink">
        <p className="font-medium text-terracotta">Before running this for real, at scale:</p>
        <ul className="mt-1.5 list-disc pl-5 text-muted">
          <li>Resend needs to be on the Pro plan — the free tier's send volume won't cover thousands of invite emails in one go.</li>
          <li>Supabase Auth's email sending needs custom SMTP (via Resend) configured, since its own default sender has a very low rate limit.</li>
        </ul>
        <p className="mt-1.5 text-muted">Fine to test with a handful of real addresses first regardless.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Upload a CSV/text file, or paste emails below
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          disabled={status === "running"}
          className="mb-2 w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-teal file:px-3 file:py-1 file:text-xs file:font-medium file:text-porcelain focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
        />
        <textarea
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          disabled={status === "running"}
          rows={8}
          placeholder={"One per line — a bare email, or \"email,name\":\npractitioner1@clinic.com\npractitioner2@clinic.com, Jane Doe"}
          className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 font-mono text-xs text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
        />
        <p className="mt-1.5 text-xs text-muted">
          {emails.length} valid email{emails.length === 1 ? "" : "s"} detected
          {skipped > 0 && `, ${skipped} line${skipped === 1 ? "" : "s"} skipped (no valid email found)`}.
        </p>
      </div>

      {status === "running" && (
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-teal transition-[width]"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Inviting… {progress.done} / {progress.total}
          </p>
        </div>
      )}

      {status === "done" && (
        <div className="rounded-lg border border-ink/10 bg-porcelain/60 p-3 text-sm">
          <p className="text-ink">
            <span className="font-medium text-teal">{invited} invited</span>
            {alreadyExisted > 0 && <span className="text-muted"> · {alreadyExisted} already had accounts</span>}
            {failed.length > 0 && <span className="font-medium text-terracotta"> · {failed.length} failed</span>}
          </p>
          {failed.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-terracotta">
              {failed.map((r) => (
                <li key={r.email}>
                  {r.email} — {r.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-sm font-medium text-terracotta">{error}</p>}

      <button
        type="button"
        onClick={startImport}
        disabled={status === "running" || emails.length === 0}
        className="w-fit rounded-full bg-teal px-6 py-2.5 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark disabled:opacity-60"
      >
        {status === "running" ? "Inviting…" : `Invite ${emails.length || ""} user${emails.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
