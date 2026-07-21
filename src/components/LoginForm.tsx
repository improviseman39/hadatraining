"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [awaitingMfa, setAwaitingMfa] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    let signInError;
    try {
      ({ error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      }));
    } catch {
      setError(
        "Login isn't connected yet — the site's Supabase project hasn't been set up."
      );
      setSubmitting(false);
      return;
    }

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    // 2FA is enrolled and this session hasn't been challenged for it yet —
    // show the code prompt instead of completing login.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      setAwaitingMfa(true);
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

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
    if (verifyError) {
      setError("That code didn't match. Check your app and try again.");
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (awaitingMfa) {
    return (
      <form
        onSubmit={handleMfaSubmit}
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

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@clinic.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
          <p className="mt-2 text-right text-xs">
            <Link href="/forgot-password" className="font-medium text-teal hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-terracotta">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-70"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>

        <p className="text-center text-xs leading-relaxed text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-teal hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}
