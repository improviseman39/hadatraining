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
  duration: string;
  imageId: string;
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
  imageId: string | null;
  /** Resolved, always-usable image URL — from image_storage_path if an image was
   * uploaded, otherwise built from imageId (the older Unsplash-photo-id field). */
  imageUrl: string;
  videoUrl: string | null;
  href: string | null;
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
