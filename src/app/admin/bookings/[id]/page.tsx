import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { updateBooking } from "@/app/admin/bookings/actions";
import BookingForm from "@/components/admin/BookingForm";

export const dynamic = "force-dynamic";

export default async function EditBookingPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  await requireRole(["admin", "super_admin"]);
  const params = await props.params;
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !booking) notFound();

  const [{ data: users }, { data: sessions }] = await Promise.all([
    supabase.rpc("list_profiles_for_booking"),
    supabase.from("sessions").select("id, title").is("parent_id", null).order("position"),
  ]);
  const bookedForEmail = (users ?? []).find(
    (u: { id: string; email: string }) => u.id === booking.user_id
  )?.email;

  return (
    <div>
      <Link
        href="/admin/bookings"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-teal"
      >
        &larr; Back to bookings
      </Link>
      <h2 className="mb-6 font-serif text-xl text-ink">Edit booking</h2>
      <div className="max-w-xl rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
        {bookedForEmail && (
          <p className="mb-5 text-sm text-muted">
            Booked for <span className="font-medium text-ink">{bookedForEmail}</span>
          </p>
        )}
        <BookingForm
          action={updateBooking.bind(null, booking.id)}
          users={users ?? []}
          sessions={sessions ?? []}
          defaultValues={{
            session_id: booking.session_id,
            start_at: booking.start_at,
            end_at: booking.end_at,
            notes: booking.notes,
          }}
          showUserField={false}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
