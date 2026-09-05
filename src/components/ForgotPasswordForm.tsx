"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/classLogin";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isClassSeat, setIsClassSeat] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("redirect_to", `${window.location.origin}/auth/callback?next=/reset-password`);

    startTransition(async () => {
      try {
        const result = await requestPasswordReset(formData);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        if ("isClassSeat" in result) {
          setIsClassSeat(true);
          return;
        }
        setSent(true);
      } catch {
        setError(
          "Something went wrong reaching the server. Please refresh this page (the site may have just been updated) and try again."
        );
      }
    });
  }

  if (isClassSeat) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-7 text-center shadow-sm sm:p-8">
        <p className="text-sm leading-relaxed text-ink">
          This account uses your class&apos;s shared login — there&apos;s no
          personal password to reset. Log in with your class username and
          password instead.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-teal px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
        >
          Go to login
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-7 text-center shadow-sm sm:p-8">
        <p className="text-sm text-ink">
          If an account exists for <span className="font-medium">{email}</span>, a
          reset link is on its way. Check your spam or junk folder if it doesn&apos;t
          show up in a minute.
        </p>
      </div>
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
            type="email"
            required
            autoComplete="email"
            placeholder="you@clinic.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
          className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-70"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </div>
    </form>
  );
}
