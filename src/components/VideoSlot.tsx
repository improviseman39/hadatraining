"use client";

import { useEffect, useRef } from "react";
import type PlayerType from "@vimeo/player";
import ExpandButton from "@/components/ExpandButton";
import { useExpandable } from "@/hooks/useExpandable";

type VideoSlotProps = {
  hasVideo: boolean;
  videoUrl: string | null;
  title: string;
};

export default function VideoSlot({ hasVideo, videoUrl, title }: VideoSlotProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<PlayerType | null>(null);
  const wasPlayingRef = useRef(false);
  const { expanded, toggle } = useExpandable();

  useEffect(() => {
    if (!hasVideo || !videoUrl || !iframeRef.current) return;

    let cancelled = false;

    import("@vimeo/player").then(({ default: Player }) => {
      if (cancelled || !iframeRef.current) return;
      playerRef.current = new Player(iframeRef.current);
    });

    function handleVisibilityChange() {
      const player = playerRef.current;
      if (!player) return;
      if (document.hidden) {
        player.getPaused().then((paused) => {
          wasPlayingRef.current = !paused;
          if (!paused) player.pause();
        });
      } else if (wasPlayingRef.current) {
        player.play();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [hasVideo, videoUrl]);

  if (hasVideo && videoUrl) {
    return (
      <div
        className={
          expanded
            ? "fixed inset-0 z-50 flex flex-col bg-ink p-4 sm:p-6"
            : "relative mx-auto aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-ink/10 bg-ink shadow-sm"
        }
      >
        <div className={expanded ? "relative min-h-0 flex-1" : "absolute inset-0"}>
          <iframe
            ref={iframeRef}
            src={videoUrl}
            title={`${title} — video lesson`}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="absolute right-3 top-3">
          <ExpandButton expanded={expanded} onClick={toggle} label="video" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex aspect-video w-full max-w-2xl flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/20 bg-ink/[0.03] px-6 text-center">
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
