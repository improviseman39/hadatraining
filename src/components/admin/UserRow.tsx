"use client";

import { useState, useTransition } from "react";
import {
  changeRole,
  changeUserGroup,
  removeUser,
  resetPassword,
  resetUserMfa,
} from "@/app/admin/users/actions";

type Profile = {
  id: string;
  email: string;
  role: "user" | "design" | "admin" | "super_admin";
  created_at: string;
  invited_by_email: string | null;
  group_id: string | null;
};

export default function UserRow({
  profile,
  isSelf,
  groups,
}: {
  profile: Profile;
  isSelf: boolean;
  groups: { id: string; name: string }[];
}) {
  const [role, setRole] = useState(profile.role);
  const [groupId, setGroupId] = useState(profile.group_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [mfaResetDone, setMfaResetDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleRoleChange(newRole: Profile["role"]) {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("role", newRole);
      const result = await changeRole(profile.id, formData);
      if (result?.error) setError(result.error);
      else setRole(newRole);
    });
  }

  function handleGroupChange(newGroupId: string) {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("group_id", newGroupId);
      const result = await changeUserGroup(profile.id, formData);
      if (result?.error) setError(result.error);
      else setGroupId(newGroupId);
    });
  }

  function handleRemove() {
    if (!window.confirm(`Remove ${profile.email}? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await removeUser(profile.id);
      if (result?.error) setError(result.error);
    });
  }

  function handleResetPassword() {
    if (!window.confirm(`Reset the password for ${profile.email}?`)) return;
    setError(null);
    setNewPassword(null);
    startTransition(async () => {
      const result = await resetPassword(profile.id);
      if (result?.error) setError(result.error);
      else if (result?.password) setNewPassword(result.password);
    });
  }

  function handleResetMfa() {
    if (
      !window.confirm(
        `Clear 2FA for ${profile.email}? They'll be asked to set up a new authenticator app next time they log in — use this if they've lost their device.`
      )
    )
      return;
    setError(null);
    setMfaResetDone(false);
    startTransition(async () => {
      const result = await resetUserMfa(profile.id);
      if (result?.error) setError(result.error);
      else setMfaResetDone(true);
    });
  }

  return (
    <tr className="border-b border-ink/5 last:border-0">
      <td className="px-4 py-3 font-medium text-ink">
        {profile.email}
        {isSelf && <span className="ml-2 text-xs text-muted">(you)</span>}
      </td>
      <td className="px-4 py-3">
        <select
          value={role}
          disabled={pending}
          onChange={(e) => handleRoleChange(e.target.value as Profile["role"])}
          className="rounded-lg border border-ink/15 bg-porcelain px-2 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
        >
          <option value="user">User</option>
          <option value="design">Design</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        {error && <p className="mt-1 text-xs font-medium text-terracotta">{error}</p>}
      </td>
      <td className="px-4 py-3">
        <select
          value={groupId}
          disabled={pending}
          onChange={(e) => handleGroupChange(e.target.value)}
          className="rounded-lg border border-ink/15 bg-porcelain px-2 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
        >
          <option value="">— None —</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-muted">
        {new Date(profile.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-muted">{profile.invited_by_email ?? "—"}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={pending}
            className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal disabled:opacity-30"
          >
            Reset password
          </button>
          <button
            type="button"
            onClick={handleResetMfa}
            disabled={pending}
            className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal disabled:opacity-30"
          >
            Reset 2FA
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending || isSelf}
            className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-terracotta transition-colors hover:border-terracotta disabled:opacity-30"
          >
            Remove
          </button>
        </div>
        {newPassword && (
          <p className="mt-1.5 text-xs font-medium text-teal">
            New password: <code className="rounded bg-porcelain px-1.5 py-0.5 text-ink">{newPassword}</code>{" "}
            (copy it now, it won&apos;t be shown again)
          </p>
        )}
        {mfaResetDone && (
          <p className="mt-1.5 text-xs font-medium text-teal">
            2FA cleared — they&apos;ll set up a new authenticator app on next login.
          </p>
        )}
      </td>
    </tr>
  );
}
