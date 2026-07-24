import Image from "next/image";
import Link from "next/link";

export default function LockGate({
  imageUrl,
  title,
}: {
  imageUrl: string;
  title: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink/10">
      <div className="relative h-80 w-full sm:h-96">
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="100vw"
          className="scale-105 object-cover blur-sm"
        />
        <div className="absolute inset-0 bg-ink/75" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-porcelain/30 bg-porcelain/10 text-porcelain"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.75" />
            <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        </span>
        <div>
          <p className="font-serif text-2xl text-porcelain">
            Members-only session
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-porcelain/70">
            Log in with a HADA membership to access the {title} video lesson
            and downloadable materials.
          </p>
        </div>
        <Link
          href="/login"
          className="rounded-full bg-teal px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
        >
          Log in to unlock
        </Link>
      </div>
    </div>
  );
}
