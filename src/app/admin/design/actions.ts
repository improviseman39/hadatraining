"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

const HEADING_FONTS = ["fraunces", "playfair", "lora"] as const;
const BODY_FONTS = ["inter", "system"] as const;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function normalizeUrl(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function updateSiteSettings(formData: FormData) {
  const { user } = await requireRole(["design", "admin", "super_admin"]);
  const supabase = await createClient();

  const headerTitle = String(formData.get("header_title") ?? "").trim();
  const headerSubtitle = String(formData.get("header_subtitle") ?? "").trim();
  const primaryColor = String(formData.get("primary_color") ?? "").trim();
  const primaryColorDark = String(formData.get("primary_color_dark") ?? "").trim();
  const headingFont = String(formData.get("heading_font") ?? "");
  const bodyFont = String(formData.get("body_font") ?? "");
  const removeLogo = formData.get("remove_logo") === "on";
  const logoStoragePath = String(formData.get("logo_storage_path") ?? "").trim();

  if (!headerTitle || !headerSubtitle) {
    return { error: "Header title and subtitle are both required." };
  }
  if (!HEX_COLOR.test(primaryColor) || !HEX_COLOR.test(primaryColorDark)) {
    return { error: "Colors must be valid." };
  }
  if (!HEADING_FONTS.includes(headingFont as (typeof HEADING_FONTS)[number])) {
    return { error: "Invalid heading font." };
  }
  if (!BODY_FONTS.includes(bodyFont as (typeof BODY_FONTS)[number])) {
    return { error: "Invalid body font." };
  }

  const socialFields = ["instagram_url", "line_url", "threads_url"] as const;
  const socialValues: Record<string, string | null> = {};
  for (const field of socialFields) {
    const raw = formData.get(field);
    if (raw && String(raw).trim() && normalizeUrl(raw) === null) {
      return { error: "Social links must be valid web addresses (starting with https://)." };
    }
    socialValues[field] = normalizeUrl(raw);
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      header_title: headerTitle,
      header_subtitle: headerSubtitle,
      primary_color: primaryColor,
      primary_color_dark: primaryColorDark,
      heading_font: headingFont,
      body_font: bodyFont,
      logo_storage_path: removeLogo ? null : logoStoragePath || undefined,
      instagram_url: socialValues.instagram_url,
      line_url: socialValues.line_url,
      threads_url: socialValues.threads_url,
      updated_by: user.id,
    })
    .eq("id", true);

  if (error) return { error: error.message };

  // Branding affects every page (logged-out visitors included), so the
  // whole tree needs revalidating, not just /admin/design.
  revalidatePath("/", "layout");
  return { success: true };
}
