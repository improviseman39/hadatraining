import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PKCE code-exchange endpoint. Not used by plain email/password sign-in,
 * but required to be in place (and allow-listed in the Supabase dashboard's
 * Redirect URLs) for any future magic-link or password-reset flow.
 */
/** Only allow same-site relative paths — "//evil.com" or "@evil.com" style
 * values must never reach NextResponse.redirect(`${origin}${next}`). */
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
