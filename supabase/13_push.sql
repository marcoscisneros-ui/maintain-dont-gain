-- =====================================================================
-- Maintain, Don't Gain — update: phone (push) notifications
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

-- One row per phone/browser that said "yes" to notifications.
create table if not exists public.push_subscriptions (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles on delete cascade default auth.uid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "push: read own or admin" on public.push_subscriptions;
drop policy if exists "push: add own" on public.push_subscriptions;
drop policy if exists "push: remove own" on public.push_subscriptions;
create policy "push: read own or admin" on public.push_subscriptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "push: add own" on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy "push: remove own" on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
revoke all on public.push_subscriptions from anon;
revoke update on public.push_subscriptions from authenticated;

notify pgrst, 'reload schema';
