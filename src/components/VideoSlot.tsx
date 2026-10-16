"use client";

import { useEffect, useRef } from "react";
import type PlayerType from "@vimeo/player";
import ExpandButton from "@/components/ExpandButton";
import { useExpandable } from "@/hooks/useExpandable";
import { createProgressFlusher } from "@/lib/progress/createProgressFlusher";
import { saveVideoProgress } from "@/lib/actions/progress";

type VideoSlotProps = {
  hasVideo: boolean;
  videoUrl: string | null;
  title: string;
  /** Identifies this block for progress saving - omitted when there's no
   * logged-in user to save progress for (SessionContent only passes these
   * for a signed-in member). */
  contentBlockId?: string;
  sessionId?: string;
  /** Where to resume playback from, in seconds - undefined/0 plays from the start. */
  resumeSeconds?: number;
};

export default function VideoSlot({
  hasVideo,
  videoUrl,
  title,
  contentBlockId,
  sessionId,
  resumeSeconds,
}: VideoSlotProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<PlayerType | null>(null);
  const wasPlayingRef = useRef(false);
  const { expanded, toggle } = useExpandable();

  useEffect(() => {
    if (!hasVideo || !videoUrl || !iframeRef.current) return;
    const canTrackProgress = !!contentBlockId && !!sessionId;

    let cancelled = false;

    const flusher = canTrackProgress
      ? createProgressFlusher({
          save: (seconds, duration) => {
            saveVideoProgress(contentBlockId!, sessionId!, seconds, duration);
          },
        })
      : null;

    function handlePageHide() {
      if (!canTrackProgress || !flusher) return;
      // sendBeacon can't call a Server Action directly - hits the plain
      // Route Handler at /api/progress/beacon instead, same auth cookies.
      const { seconds, durationSeconds } = flusher.getCurrent();
      const payload = JSON.stringify({
        contentBlockId,
        sessionId,
        positionSeconds: seconds,
        durationSeconds,
      });
      navigator.sendBeacon(
        "/api/progress/beacon",
        new Blob([payload], { type: "application/json" })
      );
    }

    import("@vimeo/player").then(({ default: Player }) => {
      if (cancelled || !iframeRef.current) return;
      const player = new Player(iframeRef.current);
      playerRef.current = player;

      if (canTrackProgress) {
        if (resumeSeconds && resumeSeconds > 1) {
          player.setCurrentTime(resumeSeconds).catch(() => {});
        }
        player.on("timeupdate", (data: { seconds: number; duration: number }) => {
          flusher?.onTick(data.seconds, data.duration || null);
        });
        window.addEventListener("pagehide", handlePageHide);
      }
    });

    function handleVisibilityChange() {
      const player = playerRef.current;
      if (!player) return;
      if (document.hidden) {
        player.getPaused().then((paused) => {
          wasPlayingRef.current = !paused;
          if (!paused) player.pause();
        });
        if (canTrackProgress) flusher?.flushNow();
      } else if (wasPlayingRef.current) {
        player.play();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      if (canTrackProgress) flusher?.flushNow();
      flusher?.destroy();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [hasVideo, videoUrl, contentBlockId, sessionId, resumeSeconds]);

  if (hasVideo && videoUrl) {
    return (
      <div
        className={
          expanded
            ? "fixed inset-0 z-50 flex flex-col bg-ink p-4 sm:p-6"
            : "relative flex w-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-sm"
        }
      >
        {/* Same header-bar chrome as PdfSlot's "Session handout" row, so a
            video block reads as the same kind of object as a handout block
            instead of a bare, uncaptioned iframe. */}
        <div className="flex items-center justify-between border-b border-ink/10 bg-card px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 6.5v11l9-5.5-9-5.5z" />
              </svg>
            </span>
            <p className="truncate text-sm font-medium text-ink">{title}</p>
          </div>
          <ExpandButton expanded={expanded} onClick={toggle} label="video" />
        </div>
        <div className={expanded ? "relative min-h-0 flex-1 bg-ink" : "relative aspect-video w-full bg-ink"}>
          <iframe
            ref={iframeRef}
            src={videoUrl}
            title={`${title} — video lesson`}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/20 bg-ink/[0.03] px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 text-teal"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 6.5v11l9-5.5-9-5.5z"
            fill="currentColor"
          />
        </svg>
      </span>
      <p className="font-serif text-lg text-ink">Video not yet uploaded</p>
      <p className="max-w-xs text-sm text-muted">
        This session&apos;s video lesson will appear here once it&apos;s published.
      </p>
    </div>
  );
}
