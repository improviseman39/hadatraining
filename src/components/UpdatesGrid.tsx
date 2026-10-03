import Image from "next/image";
import Link from "next/link";
import type { Announcement } from "@/types/content";
import { announcementCategoryStyles } from "@/data/sessions";
import { formatAnnouncementDate } from "@/lib/formatAnnouncementDate";

/**
 * Static card grid for announcements, replacing the old sliding carousel —
 * same announcements data/filtering as before (passed in from the caller).
 * Used two ways: a 3-card teaser on the homepage (default), and the full
 * list on /updates (limit={Infinity}, asSection={false} — that page draws
 * its own heading).
 */
export default function UpdatesGrid({
  items,
  limit = 3,
  linkToAll = true,
  asSection = true,
}: {
  items: Announcement[];
  /** /updates passes Infinity to show the full list instead of a teaser. */
  limit?: number;
  linkToAll?: boolean;
  /** /updates renders its own <section>/heading, so it only wants the grid. */
  asSection?: boolean;
}) {
  const preview = items.slice(0, limit);
  if (preview.length === 0) return null;

  const grid = (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {preview.map((item) => {
        const card = (
          <>
            <div className="relative h-44 w-full overflow-hidden rounded-xl bg-ink">
              <Image
                src={item.imageUrl}
                alt=""
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span
                className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${announcementCategoryStyles[item.category]}`}
              >
                {item.category}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-serif text-lg text-ink group-hover:text-teal">
                {item.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted">
                  {formatAnnouncementDate(item.date, item.endDate, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span aria-hidden="true" className="text-teal transition-transform group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </div>
            </div>
          </>
        );

        return item.href ? (
          <Link key={item.id} href={item.href} className="group block">
            {card}
          </Link>
        ) : (
          <div key={item.id} className="group">
            {card}
          </div>
        );
      })}
    </div>
  );

  if (!asSection) return grid;

  return (
    <section id="updates" className="border-b border-ink/10 bg-porcelain">
      <div className="container-page py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
              Featured / Latest at HADA
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-ink sm:text-4xl">
              Keep up with what&rsquo;s new
            </h2>
          </div>
          {linkToAll && (
            <Link
              href="/updates"
              className="flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
            >
              View all updates
              <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>

        {grid}
      </div>
    </section>
  );
}
