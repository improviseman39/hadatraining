import Image from "next/image";
import Link from "next/link";
import type { Announcement } from "@/types/content";
import { unsplashUrl, announcementCategoryStyles } from "@/data/sessions";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Compact preview so "Latest at HADA" is visible alongside the curriculum
 * intro without scrolling — the full UpdatesCarousel further down the page
 * still has the complete list with descriptions.
 */
export default function HeroLatestPreview({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;
  const preview = items.slice(0, 3);

  return (
    <div className="rounded-2xl border border-porcelain/15 bg-card/95 p-5 shadow-xl backdrop-blur sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink">Latest at HADA</h2>
        <Link
          href="#updates"
          className="text-xs font-medium text-teal hover:underline"
        >
          View all
        </Link>
      </div>
      <ul className="flex flex-col gap-4">
        {preview.map((item) => {
          const row = (
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                <Image src={unsplashUrl(item.imageId, 120)} alt="" fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${announcementCategoryStyles[item.category]}`}
                  >
                    {item.category}
                  </span>
                  <span className="text-[11px] text-muted">{formatDate(item.date)}</span>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-ink">{item.title}</p>
              </div>
            </div>
          );
          return (
            <li key={item.id}>
              {item.href ? (
                <Link href={item.href} className="block hover:opacity-80">
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
