-- =====================================================================
-- Maintain, Don't Gain — update: bonus point days (e.g. 2X points on Black Friday)
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

insert into public.settings (key, value) values
  ('bonus_days', ''),          -- comma-separated dates, e.g. 2026-11-25,2026-11-27
  ('bonus_multiplier', '2')
on conflict (key) do nothing;

-- Leaderboard: a day's points (after the daily cap) are multiplied on bonus days.
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
      max(case when key = 'end_date'        then value end)::date as end_d,
      coalesce(max(case when key = 'bonus_days' then value end), '') as bonus,
      coalesce(nullif(max(case when key = 'bonus_multiplier' then value end), '')::int, 2) as mult
    from settings
  ),
  per_day as (
    select w.user_id, w.date, count(*) as n,
           least(sum(case w.location when 'home'  then s.p_home
                                     when 'gym'   then s.p_gym
                                     when 'class' then s.p_class
                                     else s.p_pt end),
                 coalesce(nullif(s.cap, 0), 1000000))
           * (case when w.date::text = any (string_to_array(replace(s.bonus, ' ', ''), ',')) then s.mult else 1 end) as pts
    from workouts w cross join s
    where w.date between s.start_d and s.end_d
    group by w.user_id, w.date, s.cap, s.bonus, s.mult
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
