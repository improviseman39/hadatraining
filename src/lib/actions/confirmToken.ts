"use server";

import { createClient } from "@/lib/supabase/server";

type VerifiableType = "invite" | "recovery" | "email_change" | "signup" | "magiclink";

/**
 * Exchanges an email link's token_hash for a real session — deliberately
 * only ever called from a button click on /auth/confirm, never on page
 * load. Gmail (and similar) automatically pre-visits/scans links in emails
 * for safety checks before a person ever clicks them; since Supabase's
 * verification tokens are single-use, an auto-GET-on-load design burns the
 * token before the real click happens ("Email link is invalid or has
 * expired"). Requiring an explicit interaction here is what actually
 * defeats that, since scanners don't click buttons.
 */
export async function confirmToken(
  tokenHash: string,
  type: VerifiableType
): Promise<{ error: string } | { success: true }> {
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (error) return { error: error.message };
  return { success: true };
}
