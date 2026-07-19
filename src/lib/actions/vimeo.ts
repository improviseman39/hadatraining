"use server";

import { requireRole } from "@/lib/auth/requireRole";

const VIMEO_API = "https://api.vimeo.com";
const EMBED_DOMAINS = ["hadatraining.com", "www.hadatraining.com"];

type CreateTicketResult =
  | { uploadLink: string; playerUrl: string }
  | { error: string };

/**
 * Creates a Vimeo video shell via the tus resumable-upload protocol and
 * locks its embed privacy to this site's domains. The browser then uploads
 * the actual file bytes straight to Vimeo using the returned uploadLink —
 * the file never passes through our own server, since a real training
 * video is far larger than Vercel's serverless request-body limit.
 */
export async function createVimeoUploadTicket(
  fileName: string,
  fileSize: number
): Promise<CreateTicketResult> {
  await requireRole(["admin", "super_admin"]);

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) {
    return { error: "Video uploads aren't configured yet. Paste an already-hosted Vimeo link instead." };
  }

  const createRes = await fetch(`${VIMEO_API}/me/videos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
    body: JSON.stringify({
      name: fileName,
      upload: { approach: "tus", size: String(fileSize) },
      privacy: { view: "unlisted", embed: "whitelist" },
    }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    console.error(`Vimeo video creation failed (${createRes.status}): ${body}`);
    return { error: "Couldn't start the video upload. Try again in a moment." };
  }

  const created = await createRes.json();
  const uploadLink: string | undefined = created?.upload?.upload_link;
  const uri: string | undefined = created?.uri;
  if (!uploadLink || !uri) {
    return { error: "Vimeo didn't return an upload link. Try again." };
  }
  const videoId = uri.replace("/videos/", "");

  await Promise.all(
    EMBED_DOMAINS.map((domain) =>
      fetch(`${VIMEO_API}/videos/${videoId}/privacy/domains/${domain}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.vimeo.*+json;version=3.4",
        },
      })
    )
  );

  return { uploadLink, playerUrl: `https://player.vimeo.com/video/${videoId}` };
}
