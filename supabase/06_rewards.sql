-- =====================================================================
-- Maintain, Don't Gain — update: weekly prize wheel + certificates
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

-- Prizes on the wheel. "weight" = relative chance (a prize with 30 is 3x as likely as one with 10).
create table if not exists public.prizes (
  id         bigint generated always as identity primary key,
  name       text not null,
  weight     int  not null default 10 check (weight >= 0),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- One spin per member per week. Created ONLY by the server (so nobody can pick their own prize).
create table if not exists public.spins (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles on delete cascade,
  week_start  date not null,                      -- Monday of the week that earned it
  prize_id    bigint references public.prizes on delete set null,
  prize_name  text not null,                      -- what they won, kept even if the prize is later edited
  code        text not null unique,               -- shown on the certificate, e.g. MDG-7K3Q
  created_at  timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references public.profiles on delete set null,
  unique (user_id, week_start)
);

alter table public.prizes enable row level security;
alter table public.spins  enable row level security;

drop policy if exists "prizes: members read" on public.prizes;
drop policy if exists "prizes: admins write" on public.prizes;
create policy "prizes: members read" on public.prizes for select to authenticated using (true);
create policy "prizes: admins write" on public.prizes for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.prizes from anon;

drop policy if exists "spins: read own or admin" on public.spins;
drop policy if exists "spins: admins mark redeemed" on public.spins;
create policy "spins: read own or admin" on public.spins for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "spins: admins mark redeemed" on public.spins for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.spins from anon;
revoke insert, update, delete on public.spins from authenticated;
grant update (redeemed_at, redeemed_by) on public.spins to authenticated;

insert into public.settings (key, value) values ('spin_min_days', '4') on conflict (key) do nothing;

-- Starter prizes (only if the wheel is empty). Edit these in Admin → Rewards.
insert into public.prizes (name, weight)
select * from (values
  ('Free smoothie or drink', 30),
  ('Bring-a-friend guest pass', 25),
  ('Entry into the grand prize raffle', 20),
  ('Gym swag item', 15),
  ('Free 30-min personal training session', 10)
) as v(name, weight)
where not exists (select 1 from public.prizes);

notify pgrst, 'reload schema';
