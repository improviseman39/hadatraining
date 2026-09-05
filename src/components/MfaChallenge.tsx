"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * The "enter your 6-digit authenticator code" step, shared by any sign-in
 * path that can leave a session at aal1 with a verified TOTP factor still
 * outstanding — used by LoginForm both for a normal email/password sign-in
 * and for a returning class-login seat (whose sign-in happens server-side,
 * so it has to check for this step right after the server action returns
 * rather than after its own client-side sign-in call).
 */
export default function MfaChallenge({ onVerified }: { onVerified: () => void }) {
  const [mfaCode, setMfaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factorId = factors?.totp?.[0]?.id;
    if (!factorId) {
      setError("No authenticator app is set up on this account.");
      setSubmitting(false);
      return;
    }

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: mfaCode,
    });
    if (verifyError) {
      setError("That code didn't match. Check your app and try again.");
      setSubmitting(false);
      return;
    }

    onVerified();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="mfa-code" className="mb-2 block text-sm font-medium text-ink">
            Authenticator code
          </label>
          <p className="mb-3 text-sm text-muted">
            Enter the 6-digit code from your authenticator app.
          </p>
          <input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            placeholder="123456"
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-center text-lg tracking-[0.3em] text-ink placeholder:tracking-normal placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-terracotta">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || mfaCode.length !== 6}
          className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-50"
        >
          {submitting ? "Verifying…" : "Verify"}
        </button>
      </div>
    </form>
  );
}
