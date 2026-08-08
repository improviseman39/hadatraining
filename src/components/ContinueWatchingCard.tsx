import Image from "next/image";
import Link from "next/link";

export default function ContinueWatchingCard({
  sessionSlug,
  sessionTitle,
  sessionImageUrl,
  blockId,
  blockTitle,
}: {
  sessionSlug: string;
  sessionTitle: string;
  sessionImageUrl: string;
  blockId: string;
  blockTitle: string | null;
}) {
  return (
    <Link
      href={`/sessions/${sessionSlug}#block-${blockId}`}
      className="group mb-10 flex items-center gap-4 overflow-hidden rounded-2xl border border-teal/20 bg-teal/5 p-3 transition-colors hover:border-teal/40 sm:mb-12 sm:p-4"
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-28">
        <Image src={sessionImageUrl} alt="" fill sizes="140px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-dark">
          Continue watching
        </p>
        <p className="mt-0.5 truncate font-serif text-lg text-ink group-hover:text-teal">
          {sessionTitle}
        </p>
        {blockTitle && <p className="truncate text-sm text-muted">{blockTitle}</p>}
      </div>
      <span aria-hidden="true" className="mr-2 shrink-0 text-teal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
