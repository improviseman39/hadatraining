"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmToken } from "@/lib/actions/confirmToken";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  function handleConfirm() {
    if (!tokenHash || !type) {
      setError("This link is missing information it needs. Try the original email link again.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await confirmToken(
        tokenHash,
        type as "invite" | "recovery" | "email_change" | "signup" | "magiclink"
      );
      if ("error" in result) {
        setError(
          result.error.toLowerCase().includes("expired") || result.error.toLowerCase().includes("invalid")
            ? "This link has expired or was already used. Ask for a new one and try again."
            : result.error
        );
        return;
      }
      router.push(next);
      router.refresh();
    });
  }

  if (!tokenHash || !type) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-7 text-center shadow-sm sm:p-8">
        <p className="text-sm font-medium text-terracotta">
          This link is missing information it needs. Try the original email link again.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-7 text-center shadow-sm sm:p-8">
      <p className="mb-6 text-sm leading-relaxed text-ink">
        Tap below to continue — this confirms it's really you, not an automated link scan.
      </p>
      {error && <p role="alert" className="mb-4 text-sm font-medium text-terracotta">{error}</p>}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={pending}
        className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-60"
      >
        {pending ? "Confirming…" : "Continue"}
      </button>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center font-serif text-xl text-ink">Confirm it&apos;s you</h1>
      <Suspense fallback={<div className="rounded-2xl border border-ink/10 bg-card p-7 text-center text-sm text-muted shadow-sm sm:p-8">Loading…</div>}>
        <ConfirmContent />
      </Suspense>
    </div>
  );
}
