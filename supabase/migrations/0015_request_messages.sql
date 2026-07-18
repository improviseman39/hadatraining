-- Follow-up messages on a request thread — the original submission lives
-- in requests.message; every reply (from either the requester or staff)
-- lives here, oldest first, enabling a back-and-forth conversation per
-- request instead of a single fire-and-forget submission.

create table public.request_messages (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.requests(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index request_messages_request_id_created_at_idx
  on public.request_messages (request_id, created_at);

alter table public.request_messages enable row level security;

-- A member reads/writes messages only on a thread they own, as themselves.
grant select, insert on public.request_messages to authenticated;

create policy "request_messages_select_own_thread"
  on public.request_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.requests r
      where r.id = request_messages.request_id and r.user_id = auth.uid()
    )
  );

create policy "request_messages_insert_own_thread"
  on public.request_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.requests r
      where r.id = request_messages.request_id and r.user_id = auth.uid()
    )
  );

-- admin/super_admin can read every thread and post as themselves into any of them.
create policy "request_messages_admin_all"
  on public.request_messages
  for all
  using (public.is_admin_or_super())
  with check (public.is_admin_or_super() and sender_id = auth.uid());

-- No update/delete policy: messages are an immutable log — editing would
-- misrepresent what was actually said in the conversation.
