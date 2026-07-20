import "server-only";

/**
 * Shared Resend sender for our own custom transactional emails (distinct
 * from Supabase Auth's own invite/recovery emails, which go through
 * Supabase's built-in sender instead). Falls back to console logging when
 * RESEND_API_KEY isn't set — same graceful-degrade pattern used elsewhere
 * in local dev.
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string
): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Email to ${to} — ${subject}:\n${text}`);
    return {};
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "HADA Aesthetic Training <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Resend send failed (${response.status}): ${body}`);
    return { error: "Couldn't send the email. Try again in a moment." };
  }

  return {};
}
