import type { SessionCategory } from "@/data/sessions";

export type ContentBlock =
  | { id: string; type: "video"; position: number; title: string | null; videoUrl: string | null }
  | {
      id: string;
      type: "pdf";
      position: number;
      title: string | null;
      pdfUrl: string | null;
      pdfStoragePath: string | null;
    }
  | { id: string; type: "text"; position: number; title: string | null; body: string };

export type Session = {
  id: string;
  slug: string;
  title: string;
  category: SessionCategory;
  summary: string;
  /** Optional — not every session shows a runtime badge. */
  duration: string | null;
  imageUrl: string;
  isFree: boolean;
  position: number;
  /** Null = top-level session. Set = nested sub-topic under another session. */
  parentId: string | null;
};

export type SessionWithBlocks = Session & { blocks: ContentBlock[] };

export type AnnouncementCategory = "Seminar" | "News" | "Event";

export type Announcement = {
  id: string;
  category: AnnouncementCategory;
  title: string;
  description: string;
  date: string;
  /** Optional — set only for announcements that run across multiple days. */
  endDate: string | null;
  /** Admin override: keep showing on the public site even once the (end) date has passed. */
  alwaysVisible: boolean;
  imageId: string | null;
  /** Resolved, always-usable image URL — from image_storage_path if an image was
   * uploaded, otherwise built from imageId (the older Unsplash-photo-id field). */
  imageUrl: string;
  videoUrl: string | null;
  href: string | null;
  position: number;
};

export type QaEntry = {
  id: string;
  question: string;
  answer: string;
  position: number;
};

export type RequestStatus = "new" | "resolved";

export type UserRequest = {
  id: string;
  userId: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
};
