"use server";

import { requireRole } from "@/lib/auth/requireRole";

const VIMEO_API = "https://api.vimeo.com";
const EMBED_DOMAINS = ["hadatraining.com", "www.hadatraining.com"];
const FOLDER_NAME = "HADA Training";
const VIMEO_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.vimeo.*+json;version=3.4",
});

type CreateTicketResult =
  | { uploadLink: string; playerUrl: string }
  | { error: string };

/**
 * Vimeo's API still calls folders "projects". Finds the folder this
 * account's owner created by name so uploads land inside it instead of
 * the root library — looked up by name each time rather than a hardcoded
 * ID, so it keeps working if the folder is ever recreated.
 */
async function findHadaFolderUri(token: string): Promise<string | null> {
  const res = await fetch(`${VIMEO_API}/me/projects?per_page=100`, {
    headers: VIMEO_HEADERS(token),
  });
  if (!res.ok) {
    console.error(`Vimeo folder lookup failed (${res.status}): ${await res.text()}`);
    return null;
  }
  const body = await res.json();
  const names: string[] = (body?.data ?? []).map((p: { name?: string }) => p.name ?? "(unnamed)");
  console.log(`Vimeo folders visible to this token: ${JSON.stringify(names)}`);
  const folder = (body?.data ?? []).find(
    (project: { name?: string; uri?: string }) =>
      project.name?.trim().toLowerCase() === FOLDER_NAME.toLowerCase()
  );
  return folder?.uri ?? null;
}

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
      ...VIMEO_HEADERS(token),
      "Content-Type": "application/json",
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

  // Best-effort tightening/organizing — none of these should fail the
  // upload itself if the account's plan or folder setup doesn't cooperate.
  await Promise.all([
    ...EMBED_DOMAINS.map((domain) =>
      fetch(`${VIMEO_API}/videos/${videoId}/privacy/domains/${domain}`, {
        method: "PUT",
        headers: VIMEO_HEADERS(token),
      })
    ),
    fetch(`${VIMEO_API}${uri}`, {
      method: "PATCH",
      headers: { ...VIMEO_HEADERS(token), "Content-Type": "application/json" },
      body: JSON.stringify({ privacy: { view: "disable" } }),
    }).catch(() => null),
    (async () => {
      const folderUri = await findHadaFolderUri(token);
      if (!folderUri) {
        console.error(`Vimeo folder "${FOLDER_NAME}" not found — video left in root library.`);
        return;
      }
      const moveRes = await fetch(`${VIMEO_API}${folderUri}${uri}`, {
        method: "PUT",
        headers: VIMEO_HEADERS(token),
      });
      if (!moveRes.ok) {
        console.error(`Vimeo move-to-folder failed (${moveRes.status}): ${await moveRes.text()}`);
      } else {
        console.log(`Moved video ${uri} into folder ${folderUri}`);
      }
    })(),
  ]);

  return { uploadLink, playerUrl: `https://player.vimeo.com/video/${videoId}` };
}
