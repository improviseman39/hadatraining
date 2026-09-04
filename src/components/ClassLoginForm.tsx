"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { classLogin } from "@/lib/actions/classLogin";
import { createClient } from "@/lib/supabase/client";
import MfaChallenge from "@/components/MfaChallenge";

export default function ClassLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [awaitingMfa, setAwaitingMfa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await classLogin(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }

      // The server action signs the browser in but never redirects itself
      // (see classLogin.ts) — check for an outstanding TOTP challenge here,
      // the same way LoginForm does right after its own sign-in call.
      const supabase = createClient();
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        setAwaitingMfa(true);
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  if (awaitingMfa) {
    return (
      <MfaChallenge
        onVerified={() => {
          router.push("/");
          router.refresh();
        }}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
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
          {pending ? "Signing in…" : "Continue"}
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
