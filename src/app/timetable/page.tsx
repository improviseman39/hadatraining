import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import LocalDateTime from "@/components/LocalDateTime";

export const dynamic = "force-dynamic";

type BookingRow = {
  id: string;
  start_at: string;
  end_at: string;
  notes: string | null;
  sessions: { title: string; category: string }[] | { title: string; category: string } | null;
};

function sessionInfo(row: BookingRow) {
  const rel = row.sessions;
  const session = Array.isArray(rel) ? rel[0] : rel;
  return {
    title: session?.title ?? "Session no longer available",
    category: session?.category ?? null,
  };
}

function BookingCard({ booking, muted }: { booking: BookingRow; muted?: boolean }) {
  const { title, category } = sessionInfo(booking);
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
        muted ? "opacity-60" : ""
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          {category && (
            <span className="rounded-full border border-ink/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted">
              {category}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-serif text-lg text-ink">{title}</h3>
        <p className="mt-1 text-sm text-muted">
          <LocalDateTime value={booking.start_at} /> &ndash;{" "}
          <LocalDateTime value={booking.end_at} />
        </p>
        {booking.notes && (
          <p className="mt-2 text-sm text-muted">{booking.notes}</p>
        )}
      </div>
      <a
        href={`/api/bookings/${booking.id}/ics`}
        className="w-fit shrink-0 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-teal hover:text-teal"
      >
        Add to calendar
      </a>
    </div>
  );
}

export default async function TimetablePage() {
  const { user } = await requireRole(["user", "admin", "super_admin"]);
  const supabase = createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, notes, sessions(title, category)")
    .eq("user_id", user.id)
    .order("start_at");

  const rows = (bookings ?? []) as BookingRow[];
  const now = Date.now();
  const upcoming = rows.filter((b) => new Date(b.start_at).getTime() >= now);
  const past = rows.filter((b) => new Date(b.start_at).getTime() < now).reverse();

  return (
    <div className="container-page py-12 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
        Your schedule
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium text-ink sm:text-4xl">
        Timetable
      </h1>

      <div className="mt-10 flex flex-col gap-4">
        <h2 className="font-serif text-lg text-ink">Upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">
            No upcoming training sessions scheduled yet.
          </p>
        ) : (
          upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} />)
        )}
      </div>

      {past.length > 0 && (
        <div className="mt-12 flex flex-col gap-4">
          <h2 className="font-serif text-lg text-ink">Past sessions</h2>
          {past.map((booking) => (
            <BookingCard key={booking.id} booking={booking} muted />
          ))}
        </div>
      )}
    </div>
  );
}
