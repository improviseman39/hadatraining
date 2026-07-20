import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InviteUserForm from "@/components/admin/InviteUserForm";
import CreateUserForm from "@/components/admin/CreateUserForm";
import UserRow from "@/components/admin/UserRow";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, role, created_at, invited_by_profile:profiles!invited_by(email)")
    .order("created_at");

  return (
    <div>
      <h2 className="mb-6 font-serif text-xl text-ink">Users</h2>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">
          Invite by email
        </p>
        <Link
          href="/admin/users/bulk-import"
          className="text-xs font-medium text-teal underline underline-offset-2 hover:text-teal-dark"
        >
          Bulk import from a list →
        </Link>
      </div>
      <InviteUserForm />

      <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-muted">
        Create directly
      </p>
      <CreateUserForm />

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-porcelain/60 text-xs font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Invited by</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((profile) => {
              const invitedBy = profile.invited_by_profile as
                | { email: string }[]
                | { email: string }
                | null;
              const invitedByEmail = Array.isArray(invitedBy)
                ? (invitedBy[0]?.email ?? null)
                : (invitedBy?.email ?? null);

              return (
                <UserRow
                  key={profile.id}
                  profile={{
                    id: profile.id,
                    email: profile.email,
                    role: profile.role,
                    created_at: profile.created_at,
                    invited_by_email: invitedByEmail,
                  }}
                  isSelf={profile.id === currentUser?.id}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
