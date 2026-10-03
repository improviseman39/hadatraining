import { createClient } from "@/lib/supabase/server";
import { mapAnnouncement } from "@/lib/supabase/mappers";
import UpdatesGrid from "@/components/UpdatesGrid";

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const supabase = await createClient();
  const { data: announcementRows } = await supabase
    .from("announcements")
    .select("*")
    .order("position");

  // Same visibility rule as the homepage teaser — an announcement drops off
  // once its last relevant day has passed, unless pinned to stay visible.
  const today = new Date().toISOString().slice(0, 10);
  const announcements = (announcementRows ?? [])
    .map(mapAnnouncement)
    .filter((item) => {
      const lastVisibleDay = item.endDate && item.endDate > item.date ? item.endDate : item.date;
      return item.alwaysVisible || lastVisibleDay >= today;
    });

  return (
    <div className="container-page py-12 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
        Featured / Latest at HADA
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium text-ink sm:text-4xl">
        Updates
      </h1>

      {announcements.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No updates yet.</p>
      ) : (
        <UpdatesGrid items={announcements} limit={Infinity} asSection={false} />
      )}
    </div>
  );
}
