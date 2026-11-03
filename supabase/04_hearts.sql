-- =====================================================================
-- Maintain, Don't Gain — update: hearts + "seen" on daily messages
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

create table if not exists public.daily_engagement (
  user_id     uuid   not null references public.profiles on delete cascade default auth.uid(),
  content_id  bigint not null references public.daily_content on delete cascade,
  seen_at     timestamptz not null default now(),   -- first time they saw this message
  hearted     boolean not null default false,
  hearted_at  timestamptz,
  primary key (user_id, content_id)
);
create index if not exists daily_engagement_content_idx on public.daily_engagement (content_id);

alter table public.daily_engagement enable row level security;

drop policy if exists "engagement: read own or admin" on public.daily_engagement;
drop policy if exists "engagement: insert own" on public.daily_engagement;
drop policy if exists "engagement: update own" on public.daily_engagement;
create policy "engagement: read own or admin" on public.daily_engagement
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "engagement: insert own" on public.daily_engagement
  for insert to authenticated with check (user_id = auth.uid());
create policy "engagement: update own" on public.daily_engagement
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.daily_engagement from anon;

-- Total hearts on a message (members see the count, not who).
create or replace function public.daily_hearts(cid bigint)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from daily_engagement
  where content_id = cid and hearted and auth.uid() is not null
$$;
revoke execute on function public.daily_hearts(bigint) from anon, public;
grant execute on function public.daily_hearts(bigint) to authenticated;

notify pgrst, 'reload schema';
