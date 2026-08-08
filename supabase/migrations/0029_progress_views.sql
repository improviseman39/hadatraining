-- Read-only completion-% views on top of content_block_progress (0028).
-- Per-block %: video = position/duration (capped 100); pdf/text = binary
-- viewed?100:0 (simplest reasonable option - no page/scroll tracking).
-- Per-session %: average of every block's % in that session (a block with
-- no progress row yet counts as 0, not excluded).

create view public.my_block_progress as
select
  cb.session_id,
  cb.id as content_block_id,
  cb.type as block_type,
  case
    when cb.type = 'video' then
      case
        when coalesce(cbp.duration_seconds, 0) > 0
          then least(100, floor(coalesce(cbp.max_position_seconds, 0) / cbp.duration_seconds * 100))
        else 0
      end
    else
      case when coalesce(cbp.viewed, false) then 100 else 0 end
  end as block_percent
from public.content_blocks cb
left join public.content_block_progress cbp
  on cbp.content_block_id = cb.id and cbp.user_id = auth.uid();

-- Overall %: average of percent_complete across every session a member has
-- blocks in - i.e. average of per-session %, so it always reconciles with
-- what's shown on each individual SessionCard badge.
create view public.my_session_progress as
select
  session_id,
  count(*) as total_blocks,
  round(avg(block_percent))::int as percent_complete
from public.my_block_progress
group by session_id;

grant select on public.my_block_progress, public.my_session_progress to authenticated;
