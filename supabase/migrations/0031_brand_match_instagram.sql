-- Matches the site's brand color and logo to the HADA Instagram account
-- (@hada_aesthetic_training) at the owner's request. The exact color was
-- sampled directly from their profile picture (#0A526A); the dark/hover
-- shade is derived the same way the original teal->teal-dark pair was
-- (~78% of each channel). The logo mark (hada-mark.svg, uploaded to the
-- branding-images bucket) mirrors the small cross + "HADA" serif lockup
-- used throughout their Instagram posts.

update public.site_settings
set
  primary_color = '#0A526A',
  primary_color_dark = '#084053',
  logo_storage_path = 'hada-mark.svg'
where id = true;
