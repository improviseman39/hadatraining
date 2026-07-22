"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Announcement } from "@/types/content";
import { unsplashUrl, announcementCategoryStyles } from "@/data/sessions";

const AUTOPLAY_MS = 6000;

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function UpdatesCarousel({
  items,
}: {
  items: Announcement[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion.current || items.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, items.length]);

  if (items.length === 0) return null;

  function goTo(next: number) {
    setIndex(((next % items.length) + items.length) % items.length);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    }
  }

  return (
    <section
      id="updates"
      aria-label="Latest seminars, news, and events"
      className="border-b border-ink/10 bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="container-page py-10 sm:py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-lg text-porcelain sm:text-xl">
            Latest at HADA
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous update"
              onClick={() => goTo(index - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-porcelain/25 text-porcelain transition-colors hover:border-teal hover:text-teal"
            >
              &larr;
            </button>
            <button
              type="button"
              aria-label="Next update"
              onClick={() => goTo(index + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-porcelain/25 text-porcelain transition-colors hover:border-teal hover:text-teal"
            >
              &rarr;
            </button>
          </div>
        </div>

        <div
          role="region"
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="overflow-hidden rounded-2xl"
        >
          <div
            className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {items.map((item, i) => {
              const card = (
                <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl bg-card sm:grid-cols-2">
                  <div className="relative h-56 w-full sm:h-full sm:min-h-[240px]">
                    <Image
                      src={unsplashUrl(item.imageId, 900)}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                      priority={i === 0}
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${announcementCategoryStyles[item.category]}`}
                      >
                        {item.category}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl text-ink sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
              );

              return (
                <div
                  key={item.id}
                  className="w-full shrink-0"
                  aria-hidden={i !== index}
                >
                  {item.href ? (
                    <Link href={item.href} className="block focus-visible:outline-none">
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Go to update ${i + 1}: ${item.title}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-teal" : "w-1.5 bg-porcelain/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
