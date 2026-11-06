import "server-only";

import { randomInt, createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";

const OTP_LENGTH = 6;
// Long enough that someone who leaves to find the email (or the email is
// slow to arrive) isn't already expired when they come back.
const OTP_TTL_MINUTES = 30;
const MAX_OTP_ATTEMPTS = 5;
// Caps how many emails one account can be sent per hour — the registration
// resume path is reachable without being signed in, so without this anyone
// could use it to flood a stranger's inbox.
const MAX_CODES_PER_HOUR = 10;

function generateCode(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Creates a fresh email-verification code for `userId` and emails it.
 * login_otp_codes is server-only (0036), so this uses the service role —
 * callers are responsible for having already established who `userId` is.
 */
export async function issueVerificationCode(
  userId: string,
  email: string
): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const { count } = await admin
    .from("login_otp_codes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 60 * 60_000).toISOString());
  if ((count ?? 0) >= MAX_CODES_PER_HOUR) {
    return { error: "Too many codes have been requested. Please try again in an hour." };
  }

  const code = generateCode();
  const { error } = await admin.from("login_otp_codes").insert({
    user_id: userId,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString(),
  });
  if (error) return { error: error.message };

  return sendEmail(
    email,
    "Your HADA verification code",
    `Your verification code is ${code}.\n\nIt expires in ${OTP_TTL_MINUTES} minutes.\n\nDon't see this email? Check your spam or junk folder — first-time emails from a new sender sometimes land there.`
  );
}

export type CodeCheck = { ok: true } | { error: string; expired?: true };

/**
 * Checks `code` against the most recent outstanding code for `userId`, and
 * consumes it on success. The latest code is looked up regardless of what
 * was submitted, so a wrong guess still counts against that code's attempt
 * budget instead of silently costing nothing.
 */
export async function checkVerificationCode(userId: string, code: string): Promise<CodeCheck> {
  const admin = createAdminClient();

  const { data: outstanding } = await admin
    .from("login_otp_codes")
    .select("id, code_hash, expires_at, attempt_count")
    .eq("user_id", userId)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!outstanding) {
    return { error: "That code isn't right. Check for a more recent email, or send a new one." };
  }
  if (new Date(outstanding.expires_at) < new Date()) {
    return { error: "That code has expired. Send a new one.", expired: true };
  }
  if (outstanding.attempt_count >= MAX_OTP_ATTEMPTS) {
    return { error: "Too many incorrect attempts. Send a new code." };
  }

  if (outstanding.code_hash !== hashCode(code)) {
    await admin
      .from("login_otp_codes")
      .update({ attempt_count: outstanding.attempt_count + 1 })
      .eq("id", outstanding.id);
    const remaining = MAX_OTP_ATTEMPTS - outstanding.attempt_count - 1;
    return {
      error:
        remaining > 0
          ? "That code isn't right. Check for a more recent email, or send a new one."
          : "Too many incorrect attempts. Send a new code.",
    };
  }

  await admin
    .from("login_otp_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", outstanding.id);
  return { ok: true };
}
