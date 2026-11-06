"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { checkVerificationCode, issueVerificationCode } from "@/lib/otp";

export async function sendVerificationCode() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "You must be signed in." };

  const result = await issueVerificationCode(user.id, user.email);
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function verifyCode(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code." };

  const check = await checkVerificationCode(user.id, code);
  if ("error" in check) {
    // An expired code shouldn't be a dead end — send the next one for them.
    if (check.expired && user.email) {
      const resent = await issueVerificationCode(user.id, user.email);
      if (!resent.error) {
        return {
          error:
            "That code had expired, so we've just emailed you a new one. Check your inbox (and spam folder) and enter the new code.",
        };
      }
    }
    return { error: check.error };
  }

  // profiles' security flags are server-only (0036) — the signed-in user is
  // checked above, then the service role does the write.
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}


const MFA_RESET_RECENCY_MINUTES = 5;

/**
 * Self-serve "lost your authenticator" recovery: strips every enrolled TOTP
 * factor from the *current* signed-in account so the onboarding gate treats
 * it as never having set up 2FA, forcing a fresh enrollment on the very
 * next request. Requires an email code verified moments ago (via
 * sendVerificationCode/verifyCode above) rather than just an active
 * session — a class-login seat's session only proves the *shared* class
 * password, which isn't enough on its own to prove this specific person's
 * identity before letting them strip 2FA off someone else's already-claimed
 * seat.
 */
export async function resetMyMfa() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "You must be signed in." };

  const { data: recentCode } = await createAdminClient()
    .from("login_otp_codes")
    .select("consumed_at")
    .eq("user_id", user.id)
    .not("consumed_at", "is", null)
    .order("consumed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const verifiedRecently =
    recentCode?.consumed_at &&
    Date.now() - new Date(recentCode.consumed_at).getTime() < MFA_RESET_RECENCY_MINUTES * 60_000;
  if (!verifiedRecently) {
    return { error: "Please verify the emailed code again, then try resetting once more." };
  }

  // Supabase's own supabase.auth.mfa.unenroll() refuses to remove a
  // *verified* factor unless the session is already at aal2 — exactly the
  // level someone who lost their device can never reach. The admin API
  // has no such requirement, since it isn't the session proving its own
  // right to unenroll; the emailed-code check above is what stands in for
  // that proof instead.
  const admin = createAdminClient();
  const { data: factors, error: listError } = await admin.auth.admin.mfa.listFactors({
    userId: user.id,
  });
  if (listError) return { error: listError.message };

  for (const factor of factors?.factors ?? []) {
    const { error } = await admin.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId: user.id,
    });
    if (error) return { error: error.message };
  }

  // Best-effort — a failed notification email must never block someone
  // from actually recovering their own account.
  await sendEmail(
    user.email,
    "Your HADA two-factor authentication was reset",
    "Your two-factor authentication was just reset after you verified a code sent to this email. You'll be asked to set up a new authenticator next time you sign in. If this wasn't you, please contact us immediately via the Contact us button on the site."
  );

  return { success: true };
}

export async function completePasswordChange() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
