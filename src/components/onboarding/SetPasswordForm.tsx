"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { completePasswordChange } from "@/lib/actions/onboarding";

const MIN_LENGTH = 8;

// See the identical constant/comment in VerifyEmailForm.tsx — this step
// runs the same shape of network call and hits the same two failure modes
// (slow response, or an outright failed/stale request after a redeploy).
const SLOW_RESPONSE_MS = 4000;
const RETRY_MESSAGE =
  "Something went wrong reaching the server. Please refresh this page (the site may have just been updated) and try again.";

export default function SetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSlow(false);

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_RESPONSE_MS);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
          window.clearTimeout(slowTimer);
          setError(updateError.message);
          return;
        }

        const result = await completePasswordChange();
        window.clearTimeout(slowTimer);
        if (result?.error) {
          setError(result.error);
          return;
        }

        // Full navigation (not router.push) so the next page is guaranteed
        // to load this exact request's current deployment rather than
        // whatever version this tab's JS bundle was on, and lets the
        // middleware gate resolve the real next step from there.
        window.location.href = "/";
      } catch {
        window.clearTimeout(slowTimer);
        setError(RETRY_MESSAGE);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-ink">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Pick something you don&apos;t use anywhere else. You&apos;ll set up an
          authenticator app next, so a password manager is optional but helpful.
        </p>

        {pending && slow && (
          <p className="text-sm text-muted">
            Still working — this can take a little longer than usual right
            after an update to the site. No need to refresh or resubmit.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm font-medium text-terracotta">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-70"
        >
          {pending ? (slow ? "Still saving…" : "Saving…") : "Continue"}
        </button>
      </form>
    </div>
  );
}
