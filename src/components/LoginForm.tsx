"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, claimSeat } from "@/lib/actions/classLogin";
import { createClient } from "@/lib/supabase/client";
import MfaChallenge from "@/components/MfaChallenge";

type Step = "credentials" | "profile" | "mfa";

/**
 * One login form for everyone — an individual email+password and a class's
 * shared username+password both go through the same identifier/password
 * fields. login() decides in the background which kind it is; this
 * component only needs to react to what comes back: an outstanding TOTP
 * challenge, a first-time class device that needs a name/email before its
 * seat exists, or straight through.
 */
export default function LoginForm({ signupEnabled }: { signupEnabled: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function afterSignIn() {
    // Neither server action redirects itself — check for an outstanding
    // TOTP challenge here. A freshly-claimed seat has no factor enrolled
    // yet, so this is a no-op for it; the existing onboarding middleware
    // takes over from there (verify email, then set password, then set up
    // 2FA) instead of this component needing to know that path itself.
    const supabase = createClient();
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      setStep("mfa");
      return;
    }
    router.push("/");
    router.refresh();
  }

  function handleCredentialsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await login(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if ("needsProfile" in result) {
        setStep("profile");
        return;
      }
      await afterSignIn();
    });
  }

  function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set("username", identifier);
    formData.set("password", password);
    formData.set("full_name", `${firstName.trim()} ${surname.trim()}`.trim());
    formData.set("email", email);

    startTransition(async () => {
      const result = await claimSeat(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      await afterSignIn();
    });
  }

  if (step === "mfa") {
    return (
      <MfaChallenge
        onVerified={() => {
          router.push("/");
          router.refresh();
        }}
      />
    );
  }

  if (step === "profile") {
    return (
      <form
        onSubmit={handleProfileSubmit}
        className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed text-muted">
            First time on this device — tell us who you are before we set up
            your access.
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="first-name" className="mb-2 block text-sm font-medium text-ink">
                First name
              </label>
              <input
                id="first-name"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
            <div>
              <label htmlFor="surname" className="mb-2 block text-sm font-medium text-ink">
                Surname
              </label>
              <input
                id="surname"
                required
                autoComplete="family-name"
                value={surname}
                onChange={(event) => setSurname(event.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="seat-email" className="mb-2 block text-sm font-medium text-ink">
              Email address
            </label>
            <input
              id="seat-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@clinic.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
            <p className="mt-2 text-xs text-muted">
              We&apos;ll send a code here to verify it&apos;s really you.
            </p>
          </div>

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
            {pending ? "Setting up…" : "Continue"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleCredentialsSubmit}
      className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-ink">
            Email or class username
          </label>
          <input
            id="identifier"
            name="identifier"
            required
            autoComplete="username"
            placeholder="you@clinic.com or hada2024"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
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
          disabled={pending}
          className="mt-2 w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-70"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>

        {signupEnabled && (
          <p className="text-center text-xs leading-relaxed text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-teal hover:underline">
              Sign up
            </Link>
          </p>
        )}
      </div>
    </form>
  );
}
