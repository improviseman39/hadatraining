/**
 * Converts a timezone-less `datetime-local` input value (e.g.
 * "2026-08-01T09:00") into a UTC Date, using an explicit UTC offset in
 * minutes (as returned by the browser's `Date.prototype.getTimezoneOffset()`
 * at submit time). This runs inside a Server Action, so `new Date(str)`
 * would otherwise be parsed using the server process's own timezone
 * instead of the submitting browser's.
 */
export function localToUtc(datetimeLocal: string, offsetMinutes: number): Date {
  const [datePart, timePart] = datetimeLocal.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute + offsetMinutes));
}

/**
 * Formats a UTC Date for display in the viewer's own local timezone. Only
 * call this from a client component, after mount — in a Server Component,
 * or during a client component's SSR pass, it would use the server
 * process's timezone instead of the viewer's browser.
 */
export function formatLocal(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Formats a UTC Date as a `datetime-local` input value in the viewer's own
 * local timezone, for pre-filling an edit form. Only call this from a
 * client component, after mount (same caveat as `formatLocal`).
 */
export function toLocalDatetimeInput(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
