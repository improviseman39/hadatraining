import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import DesignSettingsForm from "@/components/admin/DesignSettingsForm";
import { updateSiteSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDesignPage() {
  await requireRole(["design", "admin", "super_admin"]);

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select(
      "header_title, header_subtitle, logo_storage_path, primary_color, primary_color_dark, heading_font, body_font, instagram_url, line_url, threads_url"
    )
    .eq("id", true)
    .single();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-xl text-ink">Design</h2>
        <p className="mt-1 text-sm text-muted">
          Sitewide branding — logo, header text, brand color, fonts, and social links.
          Changes apply immediately across the whole site once saved.
        </p>
      </div>
      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
        {settings && <DesignSettingsForm action={updateSiteSettings} settings={settings} />}
      </div>
    </div>
  );
}
