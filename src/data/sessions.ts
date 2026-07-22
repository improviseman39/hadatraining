export type SessionCategory =
  | "Foundations"
  | "Injectables"
  | "Devices"
  | "Safety";

/** Fixed display order — category is a closed set, not admin-editable. */
export const categoryOrder: SessionCategory[] = [
  "Foundations",
  "Injectables",
  "Devices",
  "Safety",
];

/** Builds an Unsplash CDN URL for a given photo id and target width. */
export function unsplashUrl(imageId: string, width = 800, quality = 75): string {
  return `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

/**
 * Shared between UpdatesCarousel ("use client") and server components like
 * HeroLatestPreview — a server component can't import a plain data export
 * from a client module, so this lives in a plain (non-"use client") file
 * both can import from.
 */
export const announcementCategoryStyles: Record<
  "Seminar" | "News" | "Event",
  string
> = {
  Seminar: "bg-teal text-porcelain",
  News: "bg-ink text-porcelain",
  Event: "bg-terracotta text-porcelain",
};
