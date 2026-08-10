import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { createBooking } from "@/app/admin/bookings/actions";
import BookingForm from "@/components/admin/BookingForm";

export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  const [{ data: users }, { data: groups }, { data: sessions }] = await Promise.all([
    supabase.rpc("list_profiles_for_booking"),
    supabase.rpc("list_groups_for_booking"),
    // Only top-level sessions are bookable — a sub-topic is organizational
    // content nested inside one, not something a trainee books separately.
    supabase.from("sessions").select("id, title").is("parent_id", null).order("position"),
  ]);

  return (
    <div>
      <Link
        href="/admin/bookings"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-teal"
      >
        &larr; Back to bookings
      </Link>
      <h2 className="mb-6 font-serif text-xl text-ink">New booking</h2>
      <div className="max-w-xl rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
        <BookingForm
          action={createBooking}
          users={users ?? []}
          groups={groups ?? []}
          sessions={sessions ?? []}
          showUserField
          submitLabel="Create booking"
        />
      </div>
    </div>
  );
}
