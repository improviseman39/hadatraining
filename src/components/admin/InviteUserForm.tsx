"use client";

import { useState, useTransition } from "react";
import { inviteUser } from "@/app/admin/users/actions";

export default function InviteUserForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await inviteUser(formData);
      if (result?.error) setError(result.error);
      else {
        setSuccess(true);
        form.reset();
      }
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
          {pending ? "Inviting…" : "Invite user"}
        </button>
      </div>
      {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
      {success && (
        <p className="text-sm font-medium text-teal">
          Invite sent — check the local Mailpit inbox at{" "}
          <a href="http://127.0.0.1:54324" target="_blank" rel="noopener noreferrer" className="underline">
            127.0.0.1:54324
          </a>{" "}
          to see it.
        </p>
      )}
    </form>
  );
}
