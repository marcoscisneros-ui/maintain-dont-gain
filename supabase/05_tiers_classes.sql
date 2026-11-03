-- =====================================================================
-- Maintain, Don't Gain — update: tiers (Free / Gold / Diamond),
-- personal training workouts, class names + ratings
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

-- Tiers. Members choose at sign-up; Gold/Diamond stay "pending" until staff confirm.
-- Only staff can change these (through the admin area), never the member.
alter table public.profiles add column if not exists tier text not null default 'free'
  check (tier in ('free', 'gold', 'diamond'));
alter table public.profiles add column if not exists tier_status text not null default 'confirmed'
  check (tier_status in ('pending', 'confirmed'));
alter table public.profiles add column if not exists sessions_used int not null default 0
  check (sessions_used >= 0);

-- Personal training as a workout type, and an optional 1–5 star rating.
alter table public.workouts drop constraint if exists workouts_location_check;
alter table public.workouts add constraint workouts_location_check
  check (location in ('home', 'gym', 'class', 'pt'));
alter table public.workouts add column if not exists rating int check (rating between 1 and 5);

insert into public.settings (key, value) values
  ('points_pt', '5'),
  ('class_names', 'Cycle, HIIT, Strength, Bootcamp, Yoga, Pilates, Boxing, Dance, Core, Stretch')
on conflict (key) do nothing;

-- Leaderboard: now counts personal training and shows confirmed tier badges.
drop function if exists public.leaderboard();
create function public.leaderboard()
returns table (user_id uuid, first_name text, last_initial text, avatar_url text,
               points int, workouts int, active_days int, tier text)
language sql stable security definer set search_path = public as $$
  with s as (
    select
      max(case when key = 'points_home'     then value end)::int  as p_home,
      max(case when key = 'points_gym'      then value end)::int  as p_gym,
      max(case when key = 'points_class'    then value end)::int  as p_class,
      coalesce(max(case when key = 'points_pt' then value end)::int, 5) as p_pt,
      max(case when key = 'daily_point_cap' then value end)::int  as cap,
      max(case when key = 'start_date'      then value end)::date as start_d,
      max(case when key = 'end_date'        then value end)::date as end_d
    from settings
  ),
  per_day as (
    select w.user_id, w.date, count(*) as n,
           least(sum(case w.location when 'home'  then s.p_home
                                     when 'gym'   then s.p_gym
                                     when 'class' then s.p_class
                                     else s.p_pt end),
                 coalesce(nullif(s.cap, 0), 1000000)) as pts
    from workouts w cross join s
    where w.date between s.start_d and s.end_d
    group by w.user_id, w.date, s.cap
  )
  select p.id, p.first_name, left(p.last_name, 1), p.avatar_url,
         coalesce(sum(d.pts), 0)::int, coalesce(sum(d.n), 0)::int, count(d.date)::int,
         case when p.tier_status = 'confirmed' then p.tier else 'free' end
  from profiles p
  left join per_day d on d.user_id = p.id
  where auth.uid() is not null
  group by p.id
  order by 5 desc, 6 desc, p.first_name;
$$;
revoke execute on function public.leaderboard() from anon, public;
grant execute on function public.leaderboard() to authenticated;

notify pgrst, 'reload schema';
