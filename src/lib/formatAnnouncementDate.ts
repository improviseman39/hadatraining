export function formatAnnouncementDate(
  date: string,
  endDate: string | null,
  options: Intl.DateTimeFormatOptions
): string {
  const start = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", options);
  if (!endDate || endDate <= date) return start;
  const end = new Date(`${endDate}T00:00:00`).toLocaleDateString("en-US", options);
  return `${start} – ${end}`;
}
