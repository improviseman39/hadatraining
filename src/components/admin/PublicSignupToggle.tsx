"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPublicSignupEnabled } from "@/app/admin/users/actions";

export default function PublicSignupToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await setPublicSignupEnabled(!enabled);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-card p-4">
      <div>
        <p className="text-sm font-medium text-ink">Public self-registration</p>
        <p className="text-xs text-muted">
          {enabled
            ? "Open — anyone can create an account at /signup."
            : "Closed — /signup shows a notice and points to class login instead. The form itself is untouched."}
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors disabled:opacity-60 ${
          enabled
            ? "border border-ink/15 text-ink hover:border-terracotta hover:text-terracotta"
            : "bg-teal text-porcelain hover:bg-teal-dark"
        }`}
      >
        {pending ? "Saving…" : enabled ? "Close registration" : "Reopen registration"}
      </button>
      {error && <p className="w-full text-xs font-medium text-terracotta">{error}</p>}
    </div>
  );
}
