import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Last-resort save when a video's tab/window is closed outright.
 * navigator.sendBeacon() can't invoke a Next.js Server Action (those are
 * POSTs to an action-encoded URL the browser doesn't know how to hit from
 * a beacon), so this is a plain Route Handler instead - same cookie-based
 * auth as everywhere else, just reachable via a normal fetch/beacon POST.
 */
export async function POST(request: Request) {
  let body: {
    contentBlockId?: string;
    sessionId?: string;
    positionSeconds?: number;
    durationSeconds?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { contentBlockId, sessionId, positionSeconds, durationSeconds } = body;
  if (!contentBlockId || !sessionId || typeof positionSeconds !== "number") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { error } = await supabase.rpc("save_video_progress", {
    p_content_block_id: contentBlockId,
    p_session_id: sessionId,
    p_position_seconds: positionSeconds,
    p_duration_seconds: durationSeconds ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
