"use server";

import { randomInt, createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function generateCode(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

async function sendOtpEmail(email: string, code: string): Promise<{ error?: string }> {
  return sendEmail(
    email,
    "Your HADA verification code",
    `Your verification code is ${code}.\n\nIt expires in ${OTP_TTL_MINUTES} minutes.\n\nDon't see this email? Check your spam or junk folder — first-time emails from a new sender sometimes land there.`
  );
}

export async function sendVerificationCode() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "You must be signed in." };

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

  const { error } = await supabase.from("login_otp_codes").insert({
    user_id: user.id,
    code_hash: hashCode(code),
    expires_at: expiresAt,
  });
  if (error) return { error: error.message };

  const sendResult = await sendOtpEmail(user.email, code);
  if (sendResult.error) return { error: sendResult.error };
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

  // Look up the most recent outstanding code for this user regardless of
  // what was submitted, so a wrong guess still counts against that code's
  // attempt budget instead of silently costing nothing.
  const { data: outstanding } = await supabase
    .from("login_otp_codes")
    .select("id, code_hash, expires_at, attempt_count")
    .eq("user_id", user.id)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!outstanding) {
    return { error: "That code isn't right. Check for a more recent email, or send a new one." };
  }
  if (new Date(outstanding.expires_at) < new Date()) {
    return { error: "That code has expired. Send a new one." };
  }
  if (outstanding.attempt_count >= MAX_OTP_ATTEMPTS) {
    return { error: "Too many incorrect attempts. Send a new code." };
  }

  if (outstanding.code_hash !== hashCode(code)) {
    await supabase
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

  await supabase
    .from("login_otp_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", outstanding.id);
  const { error } = await supabase
    .from("profiles")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function completePasswordChange() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
