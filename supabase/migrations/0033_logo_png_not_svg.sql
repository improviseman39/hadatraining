-- The initial logo was uploaded as an SVG (hada-mark.svg). Supabase Storage
-- forces Content-Disposition: attachment for SVG objects (a deliberate
-- security default, since inline SVGs can carry scripts) — browsers then
-- refuse to paint it inside an <img> tag and just silently show nothing.
-- Re-uploaded the same mark as a PNG (no such restriction applies), so
-- point the setting at that file instead.

update public.site_settings
set logo_storage_path = 'hada-mark.png'
where id = true;
