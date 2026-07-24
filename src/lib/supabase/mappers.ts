import type {
  Announcement,
  ContentBlock,
  Session,
  SessionWithBlocks,
} from "@/types/content";
import { unsplashUrl } from "@/data/sessions";

const ANNOUNCEMENT_IMAGES_BUCKET = "announcement-images";

function announcementImageUrl(imageId: string | null, storagePath: string | null): string {
  if (storagePath) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${ANNOUNCEMENT_IMAGES_BUCKET}/${storagePath}`;
  }
  if (imageId) return unsplashUrl(imageId, 900);
  // Shouldn't happen in practice — the form requires one or the other — but
  // fall back to something rather than an empty/broken image src.
  return unsplashUrl("1516549655169-df83a0774514", 900);
}

type SessionRow = {
  id: string;
  slug: string;
  title: string;
  category: Session["category"];
  summary: string;
  duration: string;
  image_id: string;
  is_free: boolean;
  position: number;
  parent_id: string | null;
};

type ContentBlockRow = {
  id: string;
  type: "video" | "pdf" | "text";
  position: number;
  title: string | null;
  video_url: string | null;
  pdf_url: string | null;
  pdf_storage_path: string | null;
  body: string | null;
};

type AnnouncementRow = {
  id: string;
  category: Announcement["category"];
  title: string;
  description: string;
  date: string;
  end_date: string | null;
  always_visible: boolean;
  image_id: string | null;
  image_storage_path: string | null;
  video_url: string | null;
  href: string | null;
  position: number;
};

export function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary,
    duration: row.duration,
    imageId: row.image_id,
    isFree: row.is_free,
    position: row.position,
    parentId: row.parent_id,
  };
}

export function mapContentBlock(row: ContentBlockRow): ContentBlock {
  const base = { id: row.id, position: row.position, title: row.title };
  switch (row.type) {
    case "video":
      return { ...base, type: "video", videoUrl: row.video_url };
    case "pdf":
      return { ...base, type: "pdf", pdfUrl: row.pdf_url, pdfStoragePath: row.pdf_storage_path };
    case "text":
      return { ...base, type: "text", body: row.body ?? "" };
  }
}

export function mapSessionWithBlocks(
  row: SessionRow & { content_blocks: ContentBlockRow[] }
): SessionWithBlocks {
  return {
    ...mapSession(row),
    blocks: row.content_blocks.map(mapContentBlock),
  };
}

export function mapAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    date: row.date,
    endDate: row.end_date,
    alwaysVisible: row.always_visible,
    imageId: row.image_id,
    imageUrl: announcementImageUrl(row.image_id, row.image_storage_path),
    videoUrl: row.video_url,
    href: row.href,
    position: row.position,
  };
}
