import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBookingIcs } from "@/lib/ics";

/**
 * No hand-written ownership check: RLS (bookings_select_own OR
 * bookings_admin_all) already determines whether this row is visible to
 * the caller. A booking that isn't theirs and they're not admin simply
 * returns no row — treated as 404, not a 403, so a booking ID's existence
 * isn't leaked to a non-owner.
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, notes, sequence, sessions(title)")
    .eq("id", params.id)
    .single();

  if (!booking) return new NextResponse("Not found", { status: 404 });

  const sessionRel = booking.sessions as { title: string }[] | { title: string } | null;
  const sessionTitle = Array.isArray(sessionRel)
    ? (sessionRel[0]?.title ?? null)
    : (sessionRel?.title ?? null);

  const { error, value } = generateBookingIcs({
    id: booking.id,
    start_at: booking.start_at,
    end_at: booking.end_at,
    notes: booking.notes,
    sequence: booking.sequence,
    sessionTitle,
  });

  if (error || !value) {
    return new NextResponse("Could not generate calendar file", { status: 500 });
  }

  return new NextResponse(value, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="hada-${params.id}.ics"`,
    },
  });
}
