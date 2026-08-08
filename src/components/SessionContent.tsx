"use client";

import { useEffect, useRef } from "react";
import type { ContentBlock, SessionWithBlocks } from "@/types/content";
import { useAuth } from "@/context/AuthContext";
import VideoSlot from "@/components/VideoSlot";
import PdfSlot from "@/components/PdfSlot";
import TextBlock from "@/components/TextBlock";
import LockGate from "@/components/LockGate";
import NotesPanel from "@/components/NotesPanel";
import { markBlockViewed } from "@/lib/actions/progress";

const defaultTitles: Record<ContentBlock["type"], string> = {
  video: "Video lesson",
  pdf: "Session material",
  text: "Notes",
};

export type BlockProgress = {
  lastPositionSeconds: number;
  viewed: boolean;
};

/** Fires markBlockViewed() once on mount for a pdf/text block, skipped if
 * the server already told us it's viewed. A tiny component (rather than an
 * effect inline in the map loop) so each block gets its own independent
 * mount-effect regardless of how many blocks are on the page. */
function ViewTracker({
  contentBlockId,
  sessionId,
  blockType,
  alreadyViewed,
}: {
  contentBlockId: string;
  sessionId: string;
  blockType: "pdf" | "text";
  alreadyViewed: boolean;
}) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (alreadyViewed || firedRef.current) return;
    firedRef.current = true;
    markBlockViewed(contentBlockId, sessionId, blockType);
  }, [contentBlockId, sessionId, blockType, alreadyViewed]);
  return null;
}

export default function SessionContent({
  session,
  progressByBlockId = {},
}: {
  session: SessionWithBlocks;
  progressByBlockId?: Record<string, BlockProgress>;
}) {
  const { isMember, isReady } = useAuth();
  const locked = !session.isFree && (!isReady || !isMember);

  if (locked) {
    return <LockGate imageUrl={session.imageUrl} title={session.title} />;
  }

  return (
    <div className="flex flex-col gap-10">
      {session.blocks.map((block) => {
        const progress = progressByBlockId[block.id];
        return (
          <div key={block.id} id={`block-${block.id}`} className="scroll-mt-24">
            <h2 className="mb-3 font-serif text-lg text-ink">
              {block.title ?? defaultTitles[block.type]}
            </h2>
            {block.type === "video" && (
              <VideoSlot
                hasVideo={!!block.videoUrl}
                videoUrl={block.videoUrl}
                title={block.title ?? defaultTitles.video}
                contentBlockId={block.id}
                sessionId={session.id}
                resumeSeconds={progress?.lastPositionSeconds}
              />
            )}
            {block.type === "pdf" && (
              <>
                <PdfSlot
                  hasPdf={!!block.pdfUrl}
                  pdfUrl={block.pdfUrl}
                  title={block.title ?? defaultTitles.pdf}
                />
                {block.pdfUrl && (
                  <ViewTracker
                    contentBlockId={block.id}
                    sessionId={session.id}
                    blockType="pdf"
                    alreadyViewed={progress?.viewed ?? false}
                  />
                )}
              </>
            )}
            {block.type === "text" && (
              <>
                <TextBlock body={block.body} />
                <ViewTracker
                  contentBlockId={block.id}
                  sessionId={session.id}
                  blockType="text"
                  alreadyViewed={progress?.viewed ?? false}
                />
              </>
            )}
          </div>
        );
      })}

      <NotesPanel slug={session.slug} />
    </div>
  );
}
