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
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (error) return { error: error.message };

  // Clicking an invite link (through the explicit-confirm step above) is
  // itself just as strong a proof of email ownership as our own 6-digit
  // OTP step — making an invited user do both is redundant friction, not
  // extra security. Mark them verified here so the onboarding gate's normal
  // step order (verify → set password → 2FA) resolves correctly from a
  // plain "/" redirect instead of a page-specific shortcut that skips it.
  if (type === "invite" && user) {
    await supabase
      .from("profiles")
      .update({ email_verified_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  return { success: true };
}
