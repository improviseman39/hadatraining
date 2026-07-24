"use client";

import type { ContentBlock, SessionWithBlocks } from "@/types/content";
import { useAuth } from "@/context/AuthContext";
import VideoSlot from "@/components/VideoSlot";
import PdfSlot from "@/components/PdfSlot";
import TextBlock from "@/components/TextBlock";
import LockGate from "@/components/LockGate";
import NotesPanel from "@/components/NotesPanel";

const defaultTitles: Record<ContentBlock["type"], string> = {
  video: "Video lesson",
  pdf: "Session material",
  text: "Notes",
};

export default function SessionContent({ session }: { session: SessionWithBlocks }) {
  const { isMember, isReady } = useAuth();
  const locked = !session.isFree && (!isReady || !isMember);

  if (locked) {
    return <LockGate imageUrl={session.imageUrl} title={session.title} />;
  }

  return (
    <div className="flex flex-col gap-10">
      {session.blocks.map((block) => (
        <div key={block.id}>
          <h2 className="mb-3 font-serif text-lg text-ink">
            {block.title ?? defaultTitles[block.type]}
          </h2>
          {block.type === "video" && (
            <VideoSlot
              hasVideo={!!block.videoUrl}
              videoUrl={block.videoUrl}
              title={block.title ?? defaultTitles.video}
            />
          )}
          {block.type === "pdf" && (
            <PdfSlot
              hasPdf={!!block.pdfUrl}
              pdfUrl={block.pdfUrl}
              title={block.title ?? defaultTitles.pdf}
            />
          )}
          {block.type === "text" && <TextBlock body={block.body} />}
        </div>
      ))}

      <NotesPanel slug={session.slug} />
    </div>
  );
}
