"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendVerificationCode, verifyCode, resetMyMfa } from "@/lib/actions/onboarding";

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

  // Self-serve "I lost my authenticator" recovery, gated behind an emailed
  // code — kept out of the main try/catch above since it's a wholly
  // separate path the person only reaches by explicitly asking for it.
  const [recovering, setRecovering] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [codeJustSent, setCodeJustSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factorId = factors?.totp?.[0]?.id;
      if (!factorId) {
        setError("No authenticator app is set up on this account.");
        return;
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError || !challenge) {
        setError(challengeError?.message ?? "Something went wrong. Try again.");
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: mfaCode,
      });
      if (verifyError) {
        setError("That code didn't match. Check your app and try again.");
        return;
      }

      onVerified();
    } catch {
      setError("Something went wrong reaching the server. Refresh this page and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartRecovery() {
    setRecovering(true);
    setRecoveryError(null);
    setRecoveryPending(true);
    try {
      const result = await sendVerificationCode();
      if (result?.error) {
        setRecoveryError(result.error);
        return;
      }
      setCodeJustSent(true);
    } catch {
      setRecoveryError("Something went wrong reaching the server. Refresh this page and try again.");
    } finally {
      setRecoveryPending(false);
    }
  }

  async function handleResendCode() {
    setRecoveryError(null);
    setRecoveryPending(true);
    try {
      const result = await sendVerificationCode();
      if (result?.error) setRecoveryError(result.error);
      else setCodeJustSent(true);
    } catch {
      setRecoveryError("Something went wrong reaching the server. Try again.");
    } finally {
      setRecoveryPending(false);
    }
  }

  async function handleVerifyRecoveryCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoveryError(null);
    setRecoveryPending(true);
    try {
      const formData = new FormData();
      formData.set("code", recoveryCode);
      const verifyResult = await verifyCode(formData);
      if (verifyResult?.error) {
        setRecoveryError(verifyResult.error);
        return;
      }
      const resetResult = await resetMyMfa();
      if (resetResult?.error) {
        setRecoveryError(resetResult.error);
        return;
      }
      // No factors left, so aal2 is no longer required — the onboarding
      // gate picks this up on the very next request and routes to
      // /onboarding/setup-2fa for a fresh enrollment.
      onVerified();
    } catch {
      setRecoveryError("Something went wrong reaching the server. Refresh this page and try again.");
    } finally {
      setRecoveryPending(false);
    }
  }

  if (recovering) {
    return (
      <form
        onSubmit={handleVerifyRecoveryCode}
        className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-ink">Reset your two-factor authentication</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {codeJustSent
                ? "We've sent a 6-digit code to your email address. Enter it below to reset 2FA on this account — you'll set up a new authenticator right after."
                : "Sending a code to your email address…"}
            </p>
          </div>

          <div>
            <label htmlFor="recovery-code" className="mb-2 block text-sm font-medium text-ink">
              Verification code
            </label>
            <input
              id="recovery-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              placeholder="123456"
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value.replace(/\D/g, ""))}
              className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-center text-lg tracking-[0.3em] text-ink placeholder:tracking-normal placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>

          {recoveryError && (
            <p role="alert" className="text-sm font-medium text-terracotta">
              {recoveryError}
            </p>
          )}

          <button
            type="submit"
            disabled={recoveryPending || recoveryCode.length !== 6}
            className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-50"
          >
            {recoveryPending ? "Working…" : "Verify & reset 2FA"}
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={recoveryPending}
              className="font-medium text-teal hover:underline disabled:opacity-50"
            >
              Send a new code
            </button>
            <button
              type="button"
              onClick={() => {
                setRecovering(false);
                setRecoveryError(null);
                setRecoveryCode("");
                setCodeJustSent(false);
              }}
              className="text-muted hover:text-ink"
            >
              &larr; Back to authenticator code
            </button>
          </div>
        </div>
      </form>
    );
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

        <button
          type="button"
          onClick={handleStartRecovery}
          className="text-center text-xs font-medium text-teal hover:underline"
        >
          Lost your authenticator? Reset by email
        </button>
      </div>
    </form>
  );
}
