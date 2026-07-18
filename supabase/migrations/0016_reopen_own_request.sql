-- requests has no UPDATE policy for a plain owner (only requests_admin_all
-- covers UPDATE, gated by is_admin_or_super()) — deliberately, so a member
-- can't rewrite their own request's message after admin has seen it. That
-- also means a member can't flip their own resolved request back to 'new'
-- via a normal UPDATE. This narrow security-definer function is the one
-- exception: it only ever moves a caller's own row from 'resolved' to
-- 'new', nothing else — same pattern as is_admin_or_super() and
-- list_profiles_for_booking() (0007/0013) for letting a caller do exactly
-- one specific thing RLS otherwise blocks.

create or replace function public.reopen_own_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.requests
  set status = 'new'
  where id = request_id
    and user_id = auth.uid()
    and status = 'resolved';
end;
$$;

grant execute on function public.reopen_own_request(uuid) to authenticated;
