-- Public bucket for announcement images uploaded directly through the admin
-- panel, instead of requiring an Unsplash photo id. Public (unlike
-- session-pdfs) because announcements themselves are public content with no
-- membership gating — no need for signed URLs, a plain public URL is fine.

insert into storage.buckets (id, name, public)
values ('announcement-images', 'announcement-images', true)
on conflict (id) do nothing;

create policy "announcement_images_admin_write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'announcement-images' and public.is_admin_or_super())
  with check (bucket_id = 'announcement-images' and public.is_admin_or_super());

create policy "announcement_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'announcement-images');

alter table public.announcements
  add column image_storage_path text,
  add column video_url text;

-- No longer strictly required now that an uploaded image (image_storage_path)
-- is a real alternative to pasting an Unsplash photo id.
alter table public.announcements alter column image_id drop not null;

comment on column public.announcements.image_storage_path is
  'Path within the public announcement-images bucket for an uploaded image. When set, takes priority over image_id (the older Unsplash-photo-id field, kept for existing rows and as a fallback).';
comment on column public.announcements.video_url is
  'Optional Vimeo player URL. When set, the announcement card shows this video instead of the image.';
