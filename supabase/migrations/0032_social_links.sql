-- Sitewide social links, editable from /admin/design alongside the rest of
-- the branding settings — same public-select / design-or-admin-or-super
-- write RLS already on site_settings, no policy changes needed.

alter table public.site_settings
  add column instagram_url text,
  add column line_url text,
  add column threads_url text;

update public.site_settings
set
  instagram_url = 'https://www.instagram.com/hada_aesthetic_training',
  line_url = 'https://line.me/R/ti/p/@hadatraining',
  threads_url = 'https://www.threads.net/@hada_aesthetic_training'
where id = true;
