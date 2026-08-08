-- Per-user, per-content-block progress. Serves two features from one row:
--   - Resume: last_position_seconds (video) + last_active_at (any block type)
--   - Completion %: max_position_seconds (video, monotonic) + viewed (pdf/text)
-- last_position_seconds vs max_position_seconds is a deliberate split: if a
-- member rewinds to re-watch a section, resume should honor that (last_*),
-- but their completion % must never regress just because they rewound
-- (max_*). A single "position" column can't serve both correctly.
create table public.content_block_progress (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  content_block_id      uuid not null references public.content_blocks(id) on delete cascade,
  session_id            uuid not null references public.sessions(id) on delete cascade,
  block_type            text not null check (block_type in ('video', 'pdf', 'text')),
  last_position_seconds numeric not null default 0,
  max_position_seconds  numeric not null default 0,
  duration_seconds      numeric,
  viewed                boolean not null default false,
  last_active_at        timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create unique index content_block_progress_user_block_uniq
  on public.content_block_progress (user_id, content_block_id);
create index content_block_progress_user_session_idx
  on public.content_block_progress (user_id, session_id);
create index content_block_progress_user_last_active_idx
  on public.content_block_progress (user_id, last_active_at desc);

create trigger content_block_progress_set_updated_at
  before update on public.content_block_progress
  for each row execute function public.set_updated_at();

alter table public.content_block_progress enable row level security;

-- Member reads/writes only their own rows. No admin policy at all -
-- individual member progress is intentionally not admin-visible.
create policy "content_block_progress_select_own"
  on public.content_block_progress
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "content_block_progress_insert_own"
  on public.content_block_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "content_block_progress_update_own"
  on public.content_block_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.content_block_progress to authenticated;
-- No anon grant, no delete policy/grant (not needed for these features).

-- Upsert as a security-invoker SQL function rather than a raw client-side
-- .upsert(): the ON CONFLICT merge needs GREATEST() for max_position_seconds
-- (must never decrease), which a plain client-side upsert can't express.
-- Runs as invoker (no SECURITY DEFINER) - it relies on the caller's own
-- RLS policies above, it doesn't need or want elevated privileges.
create or replace function public.save_video_progress(
  p_content_block_id uuid,
  p_session_id uuid,
  p_position_seconds numeric,
  p_duration_seconds numeric
)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.content_block_progress
    (user_id, content_block_id, session_id, block_type,
     last_position_seconds, max_position_seconds, duration_seconds, last_active_at)
  values
    (auth.uid(), p_content_block_id, p_session_id, 'video',
     p_position_seconds, p_position_seconds, p_duration_seconds, now())
  on conflict (user_id, content_block_id)
  do update set
    last_position_seconds = excluded.last_position_seconds,
    max_position_seconds  = greatest(content_block_progress.max_position_seconds, excluded.max_position_seconds),
    duration_seconds       = coalesce(excluded.duration_seconds, content_block_progress.duration_seconds),
    last_active_at         = now(),
    updated_at             = now();
$$;

create or replace function public.mark_block_viewed(
  p_content_block_id uuid,
  p_session_id uuid,
  p_block_type text
)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.content_block_progress
    (user_id, content_block_id, session_id, block_type, viewed, last_active_at)
  values
    (auth.uid(), p_content_block_id, p_session_id, p_block_type, true, now())
  on conflict (user_id, content_block_id)
  do update set
    viewed          = true,
    last_active_at  = now(),
    updated_at      = now();
$$;

grant execute on function public.save_video_progress(uuid, uuid, numeric, numeric) to authenticated;
grant execute on function public.mark_block_viewed(uuid, uuid, text) to authenticated;
