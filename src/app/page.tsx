import Image from "next/image";
import Link from "next/link";
import { unsplashUrl } from "@/data/sessions";
import { createClient } from "@/lib/supabase/server";
import { mapAnnouncement } from "@/lib/supabase/mappers";
import UpdatesCarousel from "@/components/UpdatesCarousel";
import HeroLoginButton from "@/components/HeroLoginButton";
import HeroLatestPreview from "@/components/HeroLatestPreview";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ count: sessionCount }, { data: announcementRows }] = await Promise.all([
    // Only top-level sessions count toward the headline number — nested
    // sub-topics are part of their parent's scope, not a session of their own.
    supabase.from("sessions").select("*", { count: "exact", head: true }).is("parent_id", null),
    supabase.from("announcements").select("*").order("position"),
  ]);

  // Once an announcement's last relevant day has passed, drop it from the
  // public site — unless the admin explicitly pinned it to stay visible.
  // A multi-day announcement's last day is its end date; otherwise it's
  // just its date (and an end date mistakenly set before the start date
  // can't make it disappear early).
  const today = new Date().toISOString().slice(0, 10);
  const announcements = (announcementRows ?? [])
    .map(mapAnnouncement)
    .filter((item) => {
      const lastVisibleDay = item.endDate && item.endDate > item.date ? item.endDate : item.date;
      return item.alwaysVisible || lastVisibleDay >= today;
    });

  const sessions = { length: sessionCount ?? 0 };

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="absolute inset-0">
          <Image
            src={unsplashUrl("1551076805-e1869033e561", 1800, 70)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal/20 blur-3xl sm:h-96 sm:w-96"
        />

        <div className="container-page relative grid grid-cols-1 items-center gap-10 py-20 sm:py-28 lg:grid-cols-[1.3fr_1fr] lg:gap-14 lg:py-32">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8FC4BE]">
              Clinical Curriculum &middot; {sessions.length} Sessions
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl font-medium leading-[1.1] text-porcelain sm:text-5xl lg:text-6xl">
              Rigorous, structured training for aesthetic medicine practitioners.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-porcelain/80 sm:text-lg">
              HADA Aesthetic Training takes you from facial anatomy fundamentals
              through injectables, devices, and safety protocol &mdash; a
              sequential curriculum built for real clinical practice.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/curriculum"
                className="rounded-full bg-teal px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
              >
                Explore the curriculum
              </Link>
              <HeroLoginButton />
            </div>
          </div>

          <HeroLatestPreview items={announcements} />
        </div>
      </section>

      <UpdatesCarousel items={announcements} />

      <section className="container-page py-16 sm:py-24">
        <div className="flex flex-col items-start gap-8 rounded-2xl border border-ink/10 bg-card p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl font-medium text-ink sm:text-4xl">
              The curriculum
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              {sessions.length} sessions across four clinical categories &mdash;
              Foundations, Injectables, Devices, and Safety &mdash; delivered
              in sequence from anatomy fundamentals to advanced technique.
            </p>
          </div>
          <Link
            href="/curriculum"
            className="w-fit shrink-0 rounded-full bg-teal px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
          >
            Explore the curriculum &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
