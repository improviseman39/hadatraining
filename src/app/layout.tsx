import type { Metadata } from "next";
import { Fraunces, Inter, Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import RequestWidget from "@/components/RequestWidget";
import { AuthProvider } from "@/context/AuthContext";
import { RequestWidgetProvider } from "@/context/RequestWidgetContext";
import { createClient } from "@/lib/supabase/server";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Curated alternates a Design-role user can switch to from /admin/design —
// pre-loaded at build time (next/font/google can't fetch arbitrary fonts at
// runtime), selected at request time via a CSS variable, see below.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const HEADING_FONT_VAR: Record<string, string> = {
  fraunces: "var(--font-fraunces)",
  playfair: "var(--font-playfair)",
  lora: "var(--font-lora)",
};

const BODY_FONT_VAR: Record<string, string> = {
  inter: "var(--font-inter)",
  system: "Helvetica, Arial, sans-serif",
};

export const metadata: Metadata = {
  title: "HADA Aesthetic Training",
  description:
    "Clinical training curriculum for aesthetic medicine practitioners and students — injectables, devices, anatomy, and safety.",
};

function hexToRgbTriplet(hex: string): string | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return null;
  const int = parseInt(match[1], 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select(
      "header_title, header_subtitle, logo_storage_path, primary_color, primary_color_dark, heading_font, body_font, instagram_url, line_url, threads_url"
    )
    .eq("id", true)
    .single();

  const socialLinks = {
    instagramUrl: settings?.instagram_url ?? null,
    lineUrl: settings?.line_url ?? null,
    threadsUrl: settings?.threads_url ?? null,
  };

  const logoUrl = settings?.logo_storage_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/branding-images/${settings.logo_storage_path}`
    : null;

  const tealRgb = settings ? hexToRgbTriplet(settings.primary_color) : null;
  const tealDarkRgb = settings ? hexToRgbTriplet(settings.primary_color_dark) : null;
  const headingFontVar = HEADING_FONT_VAR[settings?.heading_font ?? "fraunces"] ?? HEADING_FONT_VAR.fraunces;
  const bodyFontVar = BODY_FONT_VAR[settings?.body_font ?? "inter"] ?? BODY_FONT_VAR.inter;

  // hexToRgbTriplet only ever returns a strictly-validated "R G B" digit
  // triplet (or null, handled by the CSS defaults) — safe to interpolate
  // directly into a style tag.
  const themeOverrideCss = `:root {${tealRgb ? ` --color-teal-rgb: ${tealRgb};` : ""}${
    tealDarkRgb ? ` --color-teal-dark-rgb: ${tealDarkRgb};` : ""
  } --font-heading-active: ${headingFontVar}; --font-body-active: ${bodyFontVar}; }`;

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${playfair.variable} ${lora.variable}`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeOverrideCss }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          <RequestWidgetProvider>
            <SiteHeader
              headerTitle={settings?.header_title ?? "HADA"}
              headerSubtitle={settings?.header_subtitle ?? "Aesthetic Training"}
              logoUrl={logoUrl}
            />
            <main className="flex-1">{children}</main>
            <SiteFooter
              headerTitle={settings?.header_title ?? "HADA"}
              headerSubtitle={settings?.header_subtitle ?? "Aesthetic Training"}
              {...socialLinks}
            />
            <RequestWidget {...socialLinks} />
          </RequestWidgetProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
