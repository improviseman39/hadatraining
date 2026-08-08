/**
 * Throttles video-position saves to roughly once per intervalMs, and only
 * when the position actually moved (skips redundant writes while paused).
 * Plain module, no React - VideoSlot feeds it playback ticks via onTick()
 * and calls flushNow() at the moments a save must happen immediately
 * (tab hidden, unmount).
 */
export function createProgressFlusher({
  save,
  intervalMs = 12000,
}: {
  save: (seconds: number, durationSeconds: number | null) => void;
  intervalMs?: number;
}) {
  let currentSeconds = 0;
  let currentDuration: number | null = null;
  let lastSavedSeconds = 0;

  const intervalId = setInterval(() => {
    if (Math.abs(currentSeconds - lastSavedSeconds) > 1) {
      save(currentSeconds, currentDuration);
      lastSavedSeconds = currentSeconds;
    }
  }, intervalMs);

  return {
    onTick(seconds: number, durationSeconds: number | null) {
      currentSeconds = seconds;
      currentDuration = durationSeconds;
    },
    getCurrent() {
      return { seconds: currentSeconds, durationSeconds: currentDuration };
    },
    flushNow(seconds?: number, durationSeconds?: number | null) {
      const s = seconds ?? currentSeconds;
      const d = durationSeconds ?? currentDuration;
      save(s, d);
      lastSavedSeconds = s;
    },
    destroy() {
      clearInterval(intervalId);
    },
  };
}
