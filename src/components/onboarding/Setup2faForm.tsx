"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTH_APPS = [
  {
    name: "Google Authenticator",
    color: "#4285F4",
    ios: "https://apps.apple.com/us/app/google-authenticator/id388497605",
    android: "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2",
  },
  {
    name: "Microsoft Authenticator",
    color: "#0078D4",
    ios: "https://apps.apple.com/us/app/microsoft-authenticator/id983156458",
    android: "https://play.google.com/store/apps/details?id=com.azure.authenticator",
  },
];

function AuthAppIcon({ name, color }: { name: string; color: string }) {
  if (name === "Microsoft Authenticator") {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect x="2" y="2" width="13" height="13" fill="#F25022" />
        <rect x="17" y="2" width="13" height="13" fill="#7FBA00" />
        <rect x="2" y="17" width="13" height="13" fill="#00A4EF" />
        <rect x="17" y="17" width="13" height="13" fill="#FFB900" />
      </svg>
    );
  }
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="8" fill={color} />
      <path
        d="M16 8a5 5 0 0 0-5 5v2H9v9h14v-9h-2v-2a5 5 0 0 0-5-5Zm0 2a3 3 0 0 1 3 3v2h-6v-2a3 3 0 0 1 3-3Z"
        fill="#fff"
      />
    </svg>
  );
}

export default function Setup2faForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    async function setup() {
      const supabase = createClient();

      // Clean up any leftover unverified factor from a previous attempt
      // (e.g. the page was reloaded mid-setup) so enrollments don't pile up.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const unverified = existing?.all?.find(
        (f) => f.factor_type === "totp" && f.status === "unverified"
      );
      if (unverified) {
        await supabase.auth.mfa.unenroll({ factorId: unverified.id });
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (enrollError || !data) {
        setError(enrollError?.message ?? "Couldn't start 2FA setup.");
        setStatus("error");
        return;
      }
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStatus("ready");
    }
    setup();
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
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
        code,
      });
      if (verifyError) {
        setError("That code didn't match. Check your app and try again.");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-7 text-center text-sm text-muted shadow-sm sm:p-8">
        Setting up…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8">
        <p role="alert" className="text-sm font-medium text-terracotta">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-7 shadow-sm sm:p-8">
      <div className="mb-4 text-sm leading-relaxed text-ink">
        <span className="font-medium">1.</span> Install one of these free apps first, if you don&apos;t
        already have one:
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {AUTH_APPS.map((app) => (
          <div key={app.name} className="rounded-xl border border-ink/10 bg-porcelain/60 p-3">
            <div className="flex items-center gap-2.5">
              <AuthAppIcon name={app.name} color={app.color} />
              <span className="text-sm font-medium text-ink">{app.name}</span>
            </div>
            <div className="mt-2 flex gap-3 text-xs font-medium text-teal">
              <a href={app.ios} target="_blank" rel="noopener noreferrer" className="hover:underline">
                iPhone (App Store)
              </a>
              <a href={app.android} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Android (Google Play)
              </a>
            </div>
          </div>
        ))}
      </div>

      <ol start={2} className="flex flex-col gap-3 text-sm leading-relaxed text-ink">
        <li>
          <span className="font-medium">2.</span> Open the app and tap{" "}
          <span className="font-medium">+ / Add account</span>.
        </li>
        <li>
          <span className="font-medium">3.</span> Choose{" "}
          <span className="font-medium">Scan a QR code</span>, and scan the code
          below.
        </li>
      </ol>

      <div className="my-6 flex justify-center">
        {qrCode && (
          // qrCode is already a complete `data:image/svg+xml;utf-8,...`
          // URI as returned by Supabase — despite their own SDK doc
          // comment implying you need to prepend that prefix yourself.
          // Wrapping it in another data-URI layer (tried both
          // `;utf-8,${encodeURIComponent(...)}` and
          // `;base64,${btoa(...)}`) produced a broken nested URI both
          // times. Use it as-is. next/image doesn't apply to a dynamic
          // data URI like this.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrCode}
            alt="Scan this QR code with your authenticator app"
            width={200}
            height={200}
            className="rounded-lg border border-ink/10"
          />
        )}
      </div>

      <details className="mb-6 text-sm text-muted">
        <summary className="cursor-pointer font-medium text-ink">
          Can&apos;t scan it?
        </summary>
        <p className="mt-2">
          In your authenticator app, choose &ldquo;Enter a setup key&rdquo;
          instead, and type this code in manually:
        </p>
        <code className="mt-2 block break-all rounded-lg bg-porcelain px-3 py-2 text-xs">
          {secret}
        </code>
      </details>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="mfa-code" className="mb-2 block text-sm font-medium text-ink">
            4. Enter the 6-digit code your app shows you
          </label>
          <input
            id="mfa-code"
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
          {pending ? "Confirming…" : "Confirm and finish"}
        </button>
      </form>
    </div>
  );
}
