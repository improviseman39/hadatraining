import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InviteUserForm from "@/components/admin/InviteUserForm";
import CreateUserForm from "@/components/admin/CreateUserForm";
import UserRow from "@/components/admin/UserRow";
import GroupsPanel from "@/components/admin/GroupsPanel";
import ClassLoginPanel from "@/components/admin/ClassLoginPanel";
import PublicSignupToggle from "@/components/admin/PublicSignupToggle";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: groups }, { data: credentials }, { data: seats }, { data: settings }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role, created_at, group_id")
        .order("created_at"),
      supabase.from("groups").select("id, name").order("name"),
      supabase
        .from("group_login_credentials")
        .select("group_id, username, seat_limit, active"),
      supabase
        .from("group_seats")
        .select("id, group_id, claimed_at, last_seen_at, revoked_at")
        .is("revoked_at", null)
        .order("claimed_at"),
      supabase.from("site_settings").select("public_signup_enabled").eq("id", true).single(),
    ]);

  const groupList = groups ?? [];
  const memberCounts = new Map<string, number>();
  for (const profile of profiles ?? []) {
    if (!profile.group_id) continue;
    memberCounts.set(profile.group_id, (memberCounts.get(profile.group_id) ?? 0) + 1);
  }

  const credentialByGroup = new Map((credentials ?? []).map((c) => [c.group_id, c]));
  const seatsByGroup = new Map<string, typeof seats>();
  for (const seat of seats ?? []) {
    const list = seatsByGroup.get(seat.group_id) ?? [];
    list.push(seat);
    seatsByGroup.set(seat.group_id, list);
  }

  return (
    <div>
      <h2 className="mb-6 font-serif text-xl text-ink">Users</h2>

      <div className="mb-4">
        <PublicSignupToggle enabled={settings?.public_signup_enabled ?? true} />
      </div>

      <div className="mb-8">
        <GroupsPanel
          groups={groupList.map((g) => ({ ...g, memberCount: memberCounts.get(g.id) ?? 0 }))}
        />
      </div>

      <div className="mb-8">
        <ClassLoginPanel
          groups={groupList.map((g) => ({
            id: g.id,
            name: g.name,
            credential: credentialByGroup.get(g.id) ?? null,
            seats: seatsByGroup.get(g.id) ?? [],
          }))}
        />
      </div>

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
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-porcelain/60 text-xs font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((profile) => (
              <UserRow
                key={profile.id}
                profile={{
                  id: profile.id,
                  email: profile.email,
                  full_name: profile.full_name,
                  role: profile.role,
                  created_at: profile.created_at,
                  group_id: profile.group_id,
                }}
                groups={groupList}
                isSelf={profile.id === currentUser?.id}
              />
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
