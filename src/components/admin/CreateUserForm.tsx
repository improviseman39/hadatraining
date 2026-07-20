"use client";

import { useState, useTransition } from "react";
import { createUserDirect } from "@/app/admin/users/actions";

function generateClientPassword(length = 16) {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/[+/=]/g, "")
    .slice(0, length);
}

export default function CreateUserForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string; emailError?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    setError(null);
    setCreated(null);

    startTransition(async () => {
      const result = await createUserDirect(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setCreated({ email, password, emailError: result?.emailError });
      form.reset();
      setPassword("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 flex flex-col gap-3 rounded-2xl border border-ink/10 bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="sm:flex-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
          <input
            type="email"
            name="email"
            required
            placeholder="practitioner@clinic.com"
            className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <div className="sm:flex-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
          <div className="flex gap-1.5">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
            <button
              type="button"
              onClick={() => {
                setPassword(generateClientPassword());
                setShowPassword(true);
              }}
              className="shrink-0 rounded-lg border border-ink/15 px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
            >
              Generate
            </button>
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="shrink-0 rounded-lg border border-ink/15 px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Role</label>
          <select
            name="role"
            defaultValue="user"
            className="rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-teal px-6 py-2.5 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create user"}
        </button>
      </div>

      {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
      {created && (
        <p className="text-sm font-medium text-teal">
          Created {created.email} — password:{" "}
          <code className="rounded bg-porcelain px-1.5 py-0.5 text-ink">{created.password}</code>{" "}
          (copy it now, it won&apos;t be shown again).{" "}
          {created.emailError
            ? "Couldn't email them to let them know — you'll need to reach out yourself."
            : "They've also been emailed to let them know their account is ready."}
        </p>
      )}
    </form>
  );
}
