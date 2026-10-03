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

/** Short tagline shown under each category's heading on the curriculum page. */
export const categoryTagline: Record<SessionCategory, string> = {
  Foundations: "Build a strong foundation in aesthetic medicine, from anatomy to core principles.",
  Injectables: "Master the techniques and products used in modern injectable treatments.",
  Devices: "Understand the energy-based and mechanical devices used in clinical practice.",
  Safety: "Protect your patients and your practice with essential safety protocols.",
};

/** Builds an Unsplash CDN URL for a given photo id and target width. */
export function unsplashUrl(imageId: string, width = 800, quality = 75): string {
  return `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

/**
 * Shared between UpdatesGrid and server components like HeroLatestPreview —
 * a server component can't import a plain data export from a client
 * module, so this lives in a plain (non-"use client") file
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
