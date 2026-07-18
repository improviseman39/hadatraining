import { createEvent, type EventAttributes } from "ics";

function toIcsArray(d: Date): [number, number, number, number, number] {
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
  ];
}

export function generateBookingIcs(booking: {
  id: string;
  start_at: string;
  end_at: string;
  notes: string | null;
  sequence: number;
  sessionTitle: string | null;
}) {
  const attributes: EventAttributes = {
    start: toIcsArray(new Date(booking.start_at)),
    end: toIcsArray(new Date(booking.end_at)),
    startInputType: "utc",
    startOutputType: "utc",
    endInputType: "utc",
    endOutputType: "utc",
    title: `HADA: ${booking.sessionTitle ?? "Training appointment"}`,
    description: booking.notes ?? undefined,
    status: "CONFIRMED",
    organizer: { name: "HADA Aesthetic Training", email: "no-reply@hada-aesthetic-training.local" },
    uid: `${booking.id}@hada-aesthetic-training.local`,
    sequence: booking.sequence,
    calName: "HADA Aesthetic Training",
  };

  return createEvent(attributes);
}
