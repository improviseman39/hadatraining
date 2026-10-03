import Image from "next/image";
import Link from "next/link";
import { unsplashUrl } from "@/data/sessions";

export default function JoinCta() {
  return (
    <section className="relative overflow-hidden border-b border-ink/10">
      <div className="absolute inset-0">
        <Image
          src={unsplashUrl("1551190822-a9333d879b1f", 1800, 70)}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/80" />
      </div>
      <div className="container-page relative py-16 sm:py-20">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8FC4BE]">
          Ready to advance your practice?
        </p>
        <h2 className="mt-2 max-w-xl font-serif text-3xl font-medium text-porcelain sm:text-4xl">
          Join HADA today
        </h2>
        <p className="mt-3 max-w-md text-base text-porcelain/80">
          Access the full curriculum and exclusive content for members.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-porcelain px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-porcelain/90"
        >
          Register / Login
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
