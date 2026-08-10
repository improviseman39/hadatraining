"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

const HEADING_FONTS = ["fraunces", "playfair", "lora"] as const;
const BODY_FONTS = ["inter", "system"] as const;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

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
      updated_by: user.id,
    })
    .eq("id", true);

  if (error) return { error: error.message };

  // Branding affects every page (logged-out visitors included), so the
  // whole tree needs revalidating, not just /admin/design.
  revalidatePath("/", "layout");
  return { success: true };
}
