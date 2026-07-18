"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendVerificationCode, verifyCode } from "@/lib/actions/onboarding";

export default function VerifyEmailForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentStatus, setSentStatus] = useState<"sending" | "sent" | "error">("sending");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await sendVerificationCode();
      setSentStatus(result?.error ? "error" : "sent");
    });
    // Only send once, on mount — resend is a separate explicit action below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleResend() {
    setError(null);
    setSentStatus("sending");
    startTransition(async () => {
      const result = await sendVerificationCode();
      setSentStatus(result?.error ? "error" : "sent");
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("code", code);

    startTransition(async () => {
      const result = await verifyCode(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/onboarding/set-password");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="code" className="mb-2 block text-sm font-medium text-ink">
            Verification code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-4 py-2.5 text-center text-lg tracking-[0.3em] text-ink placeholder:tracking-normal placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        {sentStatus === "sending" && (
          <p className="text-sm text-muted">Sending your code…</p>
        )}
        {sentStatus === "sent" && (
          <p className="text-sm text-muted">
            Code sent. Not in your inbox after a minute?{" "}
            <span className="font-medium text-ink">Check your spam or junk folder</span> —
            first emails from a new sender sometimes land there.
          </p>
        )}
        {sentStatus === "error" && (
          <p role="alert" className="text-sm font-medium text-terracotta">
            Couldn&apos;t send the code. Try resending below.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm font-medium text-terracotta">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || code.length !== 6}
          className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal disabled:opacity-50"
        >
          {pending ? "Verifying…" : "Verify"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={pending}
          className="text-center text-sm font-medium text-teal hover:underline disabled:opacity-50"
        >
          Send a new code
        </button>
      </form>
    </div>
  );
}
