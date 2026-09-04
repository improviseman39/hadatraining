"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setGroupCredential,
  setGroupCredentialActive,
  revokeSeat,
  type ClassCredential,
  type GroupSeat,
} from "@/app/admin/users/actions";

type GroupWithCredential = {
  id: string;
  name: string;
  credential: ClassCredential | null;
  seats: GroupSeat[];
};

function CredentialForm({
  groupId,
  existingUsername,
  onSaved,
}: {
  groupId: string;
  existingUsername?: string;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("group_id", groupId);
    setError(null);
    startTransition(async () => {
      const result = await setGroupCredential(formData);
      if (result?.error) setError(result.error);
      else {
        form.reset();
        onSaved();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <input
        name="username"
        required
        defaultValue={existingUsername}
        placeholder="Username, e.g. hada2024"
        className="flex-1 rounded-lg border border-ink/15 bg-porcelain px-2.5 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
      <input
        name="password"
        required
        placeholder="Shared password"
        className="flex-1 rounded-lg border border-ink/15 bg-porcelain px-2.5 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
      <input
        name="seat_limit"
        type="number"
        min={1}
        defaultValue={200}
        className="w-24 rounded-lg border border-ink/15 bg-porcelain px-2.5 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-porcelain hover:bg-teal disabled:opacity-60"
      >
        {pending ? "Saving…" : existingUsername ? "Update" : "Set up"}
      </button>
      {error && <p className="text-xs font-medium text-terracotta sm:basis-full">{error}</p>}
    </form>
  );
}

function SeatRow({ seat }: { seat: GroupSeat }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [revoked, setRevoked] = useState(false);

  function handleRevoke() {
    if (!window.confirm("Revoke this seat? That device will need to claim a new one to sign back in.")) return;
    setError(null);
    startTransition(async () => {
      const result = await revokeSeat(seat.id);
      if (result?.error) setError(result.error);
      else {
        setRevoked(true);
        router.refresh();
      }
    });
  }

  if (revoked) return null;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-xs hover:bg-porcelain">
      <span className="text-muted">
        Seat {seat.id.slice(0, 8)} · claimed{" "}
        {new Date(seat.claimed_at).toLocaleDateString()} · last seen{" "}
        {new Date(seat.last_seen_at).toLocaleDateString()}
      </span>
      <button
        type="button"
        onClick={handleRevoke}
        disabled={pending}
        className="shrink-0 rounded-full border border-ink/15 px-2.5 py-1 font-medium text-terracotta hover:border-terracotta disabled:opacity-60"
      >
        Revoke
      </button>
      {error && <span className="text-terracotta">{error}</span>}
    </li>
  );
}

function GroupCredentialRow({ group }: { group: GroupWithCredential }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [seatsOpen, setSeatsOpen] = useState(false);
  const [togglePending, startToggle] = useTransition();

  const liveSeats = group.seats.filter((s) => !s.revoked_at);
  const credential = group.credential;

  function handleToggleActive() {
    if (!credential) return;
    startToggle(async () => {
      await setGroupCredentialActive(group.id, !credential.active);
      router.refresh();
    });
  }

  return (
    <li className="rounded-xl border border-ink/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink">{group.name}</span>
        {credential ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-teal/10 px-2.5 py-1 font-medium text-teal-dark">
              {liveSeats.length} / {credential.seat_limit} seats
            </span>
            <span
              className={`rounded-full px-2.5 py-1 font-medium ${
                credential.active ? "bg-teal/10 text-teal-dark" : "bg-ink/5 text-muted"
              }`}
            >
              {credential.active ? "Active" : "Paused"}
            </span>
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={togglePending}
              className="rounded-full border border-ink/15 px-2.5 py-1 font-medium text-ink hover:border-teal disabled:opacity-60"
            >
              {credential.active ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="rounded-full border border-ink/15 px-2.5 py-1 font-medium text-ink hover:border-teal"
            >
              {editing ? "Cancel" : "Change"}
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted">No class login set up</span>
        )}
      </div>

      {credential && !editing && (
        <p className="mt-1.5 text-xs text-muted">
          Username: <span className="font-mono text-ink">{credential.username}</span>
        </p>
      )}

      {(editing || !credential) && (
        <div className="mt-2.5">
          <CredentialForm
            groupId={group.id}
            existingUsername={credential?.username}
            onSaved={() => setEditing(false)}
          />
        </div>
      )}

      {credential && liveSeats.length > 0 && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => setSeatsOpen((v) => !v)}
            className="text-xs font-medium text-teal hover:underline"
          >
            {seatsOpen ? "Hide seats" : `Manage seats (${liveSeats.length})`}
          </button>
          {seatsOpen && (
            <ul className="mt-2 flex max-h-56 flex-col gap-0.5 overflow-y-auto rounded-lg border border-ink/10 p-1">
              {liveSeats.map((seat) => (
                <SeatRow key={seat.id} seat={seat} />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

export default function ClassLoginPanel({ groups }: { groups: GroupWithCredential[] }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-muted">
        Class login (temporary)
      </p>
      <p className="mb-4 text-xs text-muted">
        One shared username/password per cohort, handed out instead of individual invites.
        Each device that signs in gets its own seat with its own progress and 2FA — capped at
        the seat limit below. Manage groups themselves above.
      </p>
      {groups.length === 0 ? (
        <p className="text-xs text-muted">Create a group above first.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((group) => (
            <GroupCredentialRow key={group.id} group={group} />
          ))}
        </ul>
      )}
    </div>
  );
}
