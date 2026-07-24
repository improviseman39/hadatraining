-- Public bucket for session images uploaded directly through the admin
-- panel, instead of requiring an Unsplash photo id. Public because session
-- cards show their image regardless of membership/lock status — no need
-- for signed URLs, same reasoning as announcement-images.
insert into storage.buckets (id, name, public)
values ('session-images', 'session-images', true)
on conflict (id) do nothing;

create policy "session_images_admin_write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'session-images' and public.is_admin_or_super())
  with check (bucket_id = 'session-images' and public.is_admin_or_super());

create policy "session_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'session-images');

alter table public.sessions
  add column image_storage_path text;

-- No longer strictly required now that an uploaded image (image_storage_path)
-- is a real alternative to pasting an Unsplash photo id.
alter table public.sessions alter column image_id drop not null;

-- Duration is a nice-to-have display detail, not every session needs one.
alter table public.sessions alter column duration drop not null;

comment on column public.sessions.image_storage_path is
  'Path within the public session-images bucket for an uploaded image. When set, takes priority over image_id (the older Unsplash-photo-id field, kept for existing rows and as a fallback).';
