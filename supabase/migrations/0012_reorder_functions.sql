-- Atomic up/down reordering. A plpgsql function body is one implicit
-- transaction, so a two-row position swap can't collide even without a
-- unique constraint on position, and can't be left half-applied.

create or replace function public.move_session(p_session_id uuid, p_direction text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_pos integer;
  target_id uuid;
  target_pos integer;
begin
  if not public.is_admin_or_super() then
    raise exception 'not authorized';
  end if;
  if p_direction not in ('up', 'down') then
    raise exception 'invalid direction';
  end if;

  select position into current_pos from public.sessions where id = p_session_id;
  if current_pos is null then
    raise exception 'session not found';
  end if;

  if p_direction = 'up' then
    select id, position into target_id, target_pos
    from public.sessions where position < current_pos
    order by position desc limit 1;
  else
    select id, position into target_id, target_pos
    from public.sessions where position > current_pos
    order by position asc limit 1;
  end if;

  if target_id is null then
    return; -- already at the edge
  end if;

  update public.sessions set position = target_pos where id = p_session_id;
  update public.sessions set position = current_pos where id = target_id;
end;
$$;

create or replace function public.move_content_block(p_block_id uuid, p_direction text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  current_pos integer;
  target_id uuid;
  target_pos integer;
begin
  if not public.is_admin_or_super() then
    raise exception 'not authorized';
  end if;
  if p_direction not in ('up', 'down') then
    raise exception 'invalid direction';
  end if;

  select session_id, position into v_session_id, current_pos
  from public.content_blocks where id = p_block_id;
  if v_session_id is null then
    raise exception 'block not found';
  end if;

  if p_direction = 'up' then
    select id, position into target_id, target_pos
    from public.content_blocks
    where session_id = v_session_id and position < current_pos
    order by position desc limit 1;
  else
    select id, position into target_id, target_pos
    from public.content_blocks
    where session_id = v_session_id and position > current_pos
    order by position asc limit 1;
  end if;

  if target_id is null then
    return;
  end if;

  update public.content_blocks set position = target_pos where id = p_block_id;
  update public.content_blocks set position = current_pos where id = target_id;
end;
$$;

grant execute on function public.move_session(uuid, text) to authenticated;
grant execute on function public.move_content_block(uuid, text) to authenticated;
