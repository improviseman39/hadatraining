-- Arbitrary-depth nested sub-sessions (e.g. HA Filler -> "Lab Check 2025" ->
-- possibly deeper), built as a self-reference on the existing sessions
-- table rather than a new table — a sub-topic is a session like any other,
-- so it automatically gets its own content_blocks for free with zero new
-- plumbing. parent_id null = top-level session shown on the homepage
-- curriculum grid; non-null = nested under another session, discovered by
-- browsing into its parent's page.
--
-- Per product decision: a parent keeps its own content even once it has
-- children (not just a folder), and access control (is_free) + bookings
-- are decided once at the top level and always inherited down — no
-- sub-topic ever has independently different visibility.

alter table public.sessions
  add column parent_id uuid references public.sessions(id) on delete cascade;

create index sessions_parent_id_idx on public.sessions (parent_id);

comment on column public.sessions.parent_id is
  'Self-reference for nested sub-topics. Null = top-level session (shown on the homepage curriculum grid). Arbitrary depth supported.';

-- A child's is_free always mirrors its top-level ancestor's — set at
-- creation/re-parenting time here, and kept in sync afterward by the
-- cascade trigger below. There is deliberately no per-child override.
create or replace function public.sync_new_session_is_free()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.parent_id is not null then
    select is_free into new.is_free from public.sessions where id = new.parent_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sessions_sync_is_free_on_write on public.sessions;
create trigger sessions_sync_is_free_on_write
  before insert or update of parent_id on public.sessions
  for each row
  execute function public.sync_new_session_is_free();

-- When a top-level session's is_free changes, cascade it to every
-- descendant at any depth, so content_blocks' existing RLS check (which
-- only ever looks at the immediate session row's own is_free) keeps
-- working unchanged for nested sessions too.
create or replace function public.cascade_session_is_free()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.parent_id is null and new.is_free is distinct from old.is_free then
    with recursive descendants as (
      select id from public.sessions where parent_id = new.id
      union all
      select s.id from public.sessions s join descendants d on s.parent_id = d.id
    )
    update public.sessions set is_free = new.is_free where id in (select id from descendants);
  end if;
  return new;
end;
$$;

drop trigger if exists sessions_cascade_is_free on public.sessions;
create trigger sessions_cascade_is_free
  after update of is_free on public.sessions
  for each row
  execute function public.cascade_session_is_free();

-- move_session used to consider every session globally, relying on the
-- admin UI's own category grouping to make that look sensible. With
-- nesting, "up/down" needs to mean "among siblings under the same parent"
-- (or among top-level sessions, for parent_id is null) — mirrors how
-- move_content_block is already scoped to session_id.
create or replace function public.move_session(p_session_id uuid, p_direction text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_pos integer;
  current_parent uuid;
  target_id uuid;
  target_pos integer;
begin
  if not public.is_admin_or_super() then
    raise exception 'not authorized';
  end if;
  if p_direction not in ('up', 'down') then
    raise exception 'invalid direction';
  end if;

  select position, parent_id into current_pos, current_parent
  from public.sessions where id = p_session_id;
  if current_pos is null then
    raise exception 'session not found';
  end if;

  if p_direction = 'up' then
    select id, position into target_id, target_pos
    from public.sessions
    where position < current_pos and parent_id is not distinct from current_parent
    order by position desc limit 1;
  else
    select id, position into target_id, target_pos
    from public.sessions
    where position > current_pos and parent_id is not distinct from current_parent
    order by position asc limit 1;
  end if;

  if target_id is null then
    return; -- already at the edge of its siblings
  end if;

  update public.sessions set position = target_pos where id = p_session_id;
  update public.sessions set position = current_pos where id = target_id;
end;
$$;
