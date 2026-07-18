import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateBooking } from "@/app/admin/bookings/actions";
import BookingForm from "@/components/admin/BookingForm";

export const dynamic = "force-dynamic";

export default async function EditBookingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !booking) notFound();

  const [{ data: users }, { data: sessions }] = await Promise.all([
    supabase.rpc("list_profiles_for_booking"),
    supabase.from("sessions").select("id, title").order("position"),
  ]);

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
        <BookingForm
          action={updateBooking.bind(null, booking.id)}
          users={users ?? []}
          sessions={sessions ?? []}
          defaultValues={{
            user_id: booking.user_id,
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
