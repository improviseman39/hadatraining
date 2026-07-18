-- Closes a WARN from `supabase db advisors`: every other privileged
-- function (is_admin_or_super, is_super_admin, reopen_own_request, etc.)
-- already pins search_path; this trigger function was missed when it was
-- first defined in 0001. Not exploitable in practice here (it only calls
-- the unambiguous built-in now()), but pinning it matches the established
-- convention and clears the advisor warning.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
