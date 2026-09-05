"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { classLogin, claimSeat } from "@/lib/actions/classLogin";
import { createClient } from "@/lib/supabase/client";
import MfaChallenge from "@/components/MfaChallenge";

type Step = "credentials" | "profile" | "mfa";

export default function ClassLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function afterSignIn() {
    // Neither server action redirects itself — check for an outstanding
    // TOTP challenge here, the same way LoginForm does right after its own
    // sign-in call. A brand-new seat has no factor enrolled yet, so this is
    // a no-op for it; the existing onboarding middleware takes over from
    // there (verify email, then set password, then set up 2FA).
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
      const result = await classLogin(formData);
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
    formData.set("username", username);
    formData.set("password", password);

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

          <div>
            <label htmlFor="full-name" className="mb-2 block text-sm font-medium text-ink">
              Full name
            </label>
            <input
              id="full-name"
              required
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
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
          <label htmlFor="class-username" className="mb-2 block text-sm font-medium text-ink">
            Class username
          </label>
          <input
            id="class-username"
            name="username"
            required
            autoComplete="username"
            placeholder="e.g. hada2024"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <div>
          <label htmlFor="class-password" className="mb-2 block text-sm font-medium text-ink">
            Class password
          </label>
          <input
            id="class-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          disabled={pending}
          className="mt-2 w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-70"
        >
          {pending ? "Checking…" : "Continue"}
        </button>

        <p className="text-center text-xs leading-relaxed text-muted">
          Given to you by your class coordinator. Have your own individual
          login instead?{" "}
          <Link href="/login" className="font-medium text-teal hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
