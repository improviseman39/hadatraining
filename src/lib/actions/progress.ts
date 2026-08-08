"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Saves a video's playback position for the current user. Called frequently
 * (every ~12s while playing, see createProgressFlusher) so this deliberately
 * does NOT revalidatePath - the pages that read this data are already
 * force-dynamic, and revalidating on every tick would be wasteful. The
 * merge logic (never let position go backwards for completion %) lives in
 * the save_video_progress() SQL function, not here.
 */
export async function saveVideoProgress(
  contentBlockId: string,
  sessionId: string,
  positionSeconds: number,
  durationSeconds: number | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.rpc("save_video_progress", {
    p_content_block_id: contentBlockId,
    p_session_id: sessionId,
    p_position_seconds: positionSeconds,
    p_duration_seconds: durationSeconds,
  });

  if (error) return { error: error.message };
  return { success: true };
}

/** Marks a pdf/text block as opened at least once. */
export async function markBlockViewed(
  contentBlockId: string,
  sessionId: string,
  blockType: "pdf" | "text"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.rpc("mark_block_viewed", {
    p_content_block_id: contentBlockId,
    p_session_id: sessionId,
    p_block_type: blockType,
  });

  if (error) return { error: error.message };
  return { success: true };
}
