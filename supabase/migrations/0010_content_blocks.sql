-- One polymorphic table for video/text/pdf blocks, not three separate
-- tables. A session's blocks are ordered TOGETHER as one interleaved
-- sequence — splitting by type would need a UNION just to get one ordered
-- list per session, for no benefit at this scale.

create table public.content_blocks (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  type        text not null check (type in ('video', 'text', 'pdf')),
  position    integer not null,
  title       text,
  video_url   text,
  pdf_url     text,
  body        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint content_blocks_type_fields_check check (
    (type = 'video' and pdf_url is null and body is null)
    or (type = 'pdf' and video_url is null and body is null)
    or (type = 'text' and video_url is null and pdf_url is null and body is not null)
  )
);

create index content_blocks_session_id_idx on public.content_blocks (session_id);
create index content_blocks_position_idx on public.content_blocks (session_id, position);

comment on column public.content_blocks.video_url is
  'Nullable even for type=video: preserves the "not yet uploaded" placeholder state.';
comment on column public.content_blocks.position is
  'Scoped within session_id, not global. Same no-unique-constraint reorder strategy as sessions.position.';

create trigger content_blocks_set_updated_at
  before update on public.content_blocks
  for each row execute function public.set_updated_at();

alter table public.content_blocks enable row level security;

-- Public metadata, member-gated content: a block is visible if its
-- session is free, OR the requester is authenticated (ANY role — matches
-- AuthContext's isMember semantics: any logged-in user unlocks content,
-- not just admin/super_admin). This is real DB-level enforcement: a
-- non-member's request gets content_blocks: [] for a locked session, not
-- a UI-hidden-but-fetched value.
create policy "content_blocks_select"
  on public.content_blocks
  for select
  using (
    exists (
      select 1 from public.sessions s
      where s.id = content_blocks.session_id
        and (s.is_free = true or auth.role() = 'authenticated')
    )
  );

create policy "content_blocks_admin_write"
  on public.content_blocks
  for all
  using (public.is_admin_or_super())
  with check (public.is_admin_or_super());

grant select on public.content_blocks to anon, authenticated;
grant insert, update, delete on public.content_blocks to authenticated;
