import type {
  Announcement,
  ContentBlock,
  Session,
  SessionWithBlocks,
} from "@/types/content";

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
  image_id: string;
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
    imageId: row.image_id,
    href: row.href,
    position: row.position,
  };
}
