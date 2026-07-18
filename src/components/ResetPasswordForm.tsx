"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 8;

export default function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "mfa-required" | "ready" | "invalid">(
    "checking"
  );
  const [mfaCode, setMfaCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("invalid");
        return;
      }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        setStatus("mfa-required");
      } else {
        setStatus("ready");
      }
    }
    check();
  }, []);

  async function handleMfaSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    setSubmitting(false);
    if (verifyError) {
      setError("That code didn't match. Check your app and try again.");
      return;
    }

    setStatus("ready");
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (status === "checking") {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-7 text-center text-sm text-muted shadow-sm sm:p-8">
        Checking your reset link…
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-7 text-center shadow-sm sm:p-8">
        <p className="text-sm text-terracotta">
          This reset link is invalid or has expired. Request a new one from the{" "}
          <a href="/forgot-password" className="font-medium text-teal hover:underline">
            forgot password
          </a>{" "}
          page.
        </p>
      </div>
    );
  }

  if (status === "mfa-required") {
    return (
      <form
        onSubmit={handleMfaSubmit}
        className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm text-muted">
            This account has two-factor login enabled. Enter the 6-digit code from
            your authenticator app to continue resetting your password.
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            placeholder="123456"
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-center text-lg tracking-[0.3em] text-ink placeholder:tracking-normal placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
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

  return (
    <form
      onSubmit={handlePasswordSubmit}
      className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-5">
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
        {error && (
          <p role="alert" className="text-sm font-medium text-terracotta">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-70"
        >
          {submitting ? "Saving…" : "Set new password"}
        </button>
      </div>
    </form>
  );
}
