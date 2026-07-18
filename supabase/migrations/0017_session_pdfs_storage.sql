-- Private bucket for PDF handouts uploaded directly through the admin
-- panel, instead of requiring an already-hosted external URL.
--
-- Deliberately NOT gated by a storage RLS policy that re-derives
-- session-membership visibility (which would need to join storage.objects
-- -> content_blocks -> sessions on every read). The session page already
-- enforces exactly that visibility via content_blocks' own RLS
-- (0010_content_blocks.sql) — by the time a content_blocks row is
-- returned to a viewer, they're already authorized to see it. The session
-- page then mints a short-lived signed URL via the service-role client
-- for whichever pdf blocks it was actually handed, so storage access
-- follows content_blocks' authorization rather than duplicating it. The
-- only storage-level policy needed is for the admin upload path itself.

insert into storage.buckets (id, name, public)
values ('session-pdfs', 'session-pdfs', false)
on conflict (id) do nothing;

create policy "session_pdfs_admin_write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'session-pdfs' and public.is_admin_or_super())
  with check (bucket_id = 'session-pdfs' and public.is_admin_or_super());

alter table public.content_blocks
  add column pdf_storage_path text;

comment on column public.content_blocks.pdf_storage_path is
  'Path within the private session-pdfs bucket for an uploaded file. When set, the session page signs a short-lived URL server-side instead of using pdf_url directly. pdf_url stays available as a fallback for admins who prefer to paste an already-hosted link.';

alter table public.content_blocks
  add constraint content_blocks_pdf_storage_path_only_for_pdf
  check (type = 'pdf' or pdf_storage_path is null);
