-- =====================================================================
-- Maintain, Don't Gain — update: messages from staff to members (in-app inbox)
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  sender_id  uuid references public.profiles on delete set null,
  title      text,
  body       text not null,
  audience   text,                         -- e.g. "Everyone", "Gold members", "Ana M."
  created_at timestamptz not null default now()
);

create table if not exists public.message_recipients (
  message_id bigint not null references public.messages on delete cascade,
  user_id    uuid   not null references public.profiles on delete cascade,
  read_at    timestamptz,
  primary key (message_id, user_id)
);
create index if not exists message_recipients_user_idx on public.message_recipients (user_id);

alter table public.messages enable row level security;
alter table public.message_recipients enable row level security;

drop policy if exists "messages: recipients or admin read" on public.messages;
drop policy if exists "messages: admins write" on public.messages;
create policy "messages: recipients or admin read" on public.messages for select to authenticated
  using (public.is_admin() or exists (select 1 from public.message_recipients r where r.message_id = messages.id and r.user_id = auth.uid()));
create policy "messages: admins write" on public.messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "recipients: own or admin read" on public.message_recipients;
drop policy if exists "recipients: admins add/remove" on public.message_recipients;
drop policy if exists "recipients: admins remove" on public.message_recipients;
drop policy if exists "recipients: mark own read" on public.message_recipients;
create policy "recipients: own or admin read" on public.message_recipients for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "recipients: admins add/remove" on public.message_recipients for insert to authenticated
  with check (public.is_admin());
create policy "recipients: admins remove" on public.message_recipients for delete to authenticated
  using (public.is_admin());
create policy "recipients: mark own read" on public.message_recipients for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.messages, public.message_recipients from anon;
revoke update on public.message_recipients from authenticated;
grant update (read_at) on public.message_recipients to authenticated;

notify pgrst, 'reload schema';
