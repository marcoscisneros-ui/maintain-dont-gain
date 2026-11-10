-- =====================================================================
-- Maintain, Don't Gain — database setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run once on a fresh project.
-- =====================================================================

-- ---------- Profiles ------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  username        text unique not null,          -- first.lastname
  first_name      text not null,
  last_name       text not null,
  avatar_url      text,
  start_weight    numeric(5,1),                  -- lbs
  height_in       numeric(4,1),                  -- inches
  phone           text,                          -- member's phone, staff-only
  calorie_target  int  not null default 2000,
  step_goal       int  not null default 8000,
  onboarded       boolean not null default false,
  is_admin        boolean not null default false,
  tier            text not null default 'free' check (tier in ('free','gold','diamond')),
  tier_status     text not null default 'confirmed' check (tier_status in ('pending','confirmed')),
  sessions_used   int  not null default 0 check (sessions_used >= 0),
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);

-- ---------- Member logs (private to each member + admins) -----------
create table public.meals (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles on delete cascade default auth.uid(),
  date       date not null,
  name       text not null,
  calories   int  not null check (calories >= 0 and calories < 10000),
  protein    int,
  carbs      int,
  fat        int,
  created_at timestamptz not null default now()
);
create index on public.meals (user_id, date);

create table public.daily_steps (
  user_id    uuid not null references public.profiles on delete cascade default auth.uid(),
  date       date not null,
  steps      int  not null check (steps >= 0 and steps < 200000),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table public.workouts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles on delete cascade default auth.uid(),
  date       date not null,
  location   text not null check (location in ('home','gym','class','pt')),
  activity   text not null,                      -- e.g. "Strength", "Cycling class"
  minutes    int  check (minutes >= 0 and minutes < 1000),
  notes      text,
  rating     int check (rating between 1 and 5),
  created_at timestamptz not null default now()
);
create index on public.workouts (user_id, date);

create table public.inbody_scans (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles on delete cascade default auth.uid(),
  date         date not null,
  weight       numeric(5,1) not null,            -- lbs
  body_fat_pct numeric(4,1),
  smm          numeric(5,1),                     -- skeletal muscle mass, lbs
  waist_in     numeric(4,1),                     -- inches (no longer shown)
  visceral_fat numeric(4,1),                     -- InBody visceral fat level
  photo_path   text,                             -- in private bucket
  created_at   timestamptz not null default now()
);
create index on public.inbody_scans (user_id, date);

create table public.progress_photos (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles on delete cascade default auth.uid(),
  date       date not null,
  path       text not null,                      -- in private bucket
  note       text,
  created_at timestamptz not null default now()
);
create index on public.progress_photos (user_id, date);

-- ---------- Content (everyone reads, admins write) ------------------
create table public.announcements (
  id         bigint generated always as identity primary key,
  kind       text not null default 'news' check (kind in ('news','event')),
  title      text not null,
  body       text not null default '',
  image_url  text,
  event_at   timestamptz,                        -- for pop-ups / special events
  pinned     boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.library_items (                -- Recipes & Tips library
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('recipe','tip')),
  title      text not null,
  category   text not null default 'General',
  body       text not null default '',
  image_url  text,
  created_at timestamptz not null default now()
);

create table public.daily_content (                -- the daily message / tip bank
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('coach','tip')),
  position   int  not null,
  title      text,
  body       text not null,
  created_at timestamptz not null default now()
);
create index on public.daily_content (kind, position);

create table public.settings (
  key   text primary key,
  value text not null default ''
);
insert into public.settings (key, value) values
  ('start_date',      '2026-11-16'),
  ('end_date',        '2027-01-03'),
  ('coach_name',      'Marcos'),
  ('coach_title',     'Managing Partner'),
  ('coach_photo_url', ''),
  ('groupme_url',     ''),
  ('class_url',       ''),
  ('join_code',       ''),          -- blank = anyone with the link can join
  ('points_home',     '1'),
  ('points_gym',      '2'),
  ('points_class',    '3'),
  ('daily_point_cap', '5');

-- ---------- Helper: am I an admin? ----------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------- Row Level Security --------------------------------------
alter table public.profiles        enable row level security;
alter table public.meals           enable row level security;
alter table public.daily_steps     enable row level security;
alter table public.workouts        enable row level security;
alter table public.inbody_scans    enable row level security;
alter table public.progress_photos enable row level security;
alter table public.announcements   enable row level security;
alter table public.library_items   enable row level security;
alter table public.daily_content   enable row level security;
alter table public.settings        enable row level security;

-- Profiles: you see your own; admins see everyone.
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Members may only change these columns (not username / is_admin).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (first_name, last_name, avatar_url, start_weight, height_in, phone, calorie_target,
              step_goal, onboarded, last_seen_at)
  on public.profiles to authenticated;

-- Personal logs: own rows only; admins can read everyone's.
do $$
declare t text;
begin
  foreach t in array array['meals','daily_steps','workouts','inbody_scans','progress_photos'] loop
    execute format('create policy "%1$s: read own or admin" on public.%1$I
                      for select to authenticated using (user_id = auth.uid() or public.is_admin())', t);
    execute format('create policy "%1$s: insert own" on public.%1$I
                      for insert to authenticated with check (user_id = auth.uid())', t);
    execute format('create policy "%1$s: update own" on public.%1$I
                      for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "%1$s: delete own" on public.%1$I
                      for delete to authenticated using (user_id = auth.uid())', t);
    execute format('revoke all on public.%1$I from anon', t);
  end loop;
end $$;

-- Content: any signed-in member reads; only admins write.
do $$
declare t text;
begin
  foreach t in array array['announcements','library_items','daily_content'] loop
    execute format('create policy "%1$s: members read" on public.%1$I
                      for select to authenticated using (true)', t);
    execute format('create policy "%1$s: admins write" on public.%1$I
                      for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('revoke all on public.%1$I from anon', t);
  end loop;
end $$;

-- Settings: members read everything except the join code; admins write.
create policy "settings: members read" on public.settings
  for select to authenticated using (key <> 'join_code' or public.is_admin());
create policy "settings: admins write" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.settings from anon;

-- ---------- Leaderboard (only names, photos, points — no weights) ---
create or replace function public.leaderboard()
returns table (user_id uuid, first_name text, last_initial text, avatar_url text,
               points int, workouts int, active_days int)
language sql stable security definer set search_path = public as $$
  with s as (
    select
      max(case when key = 'points_home'     then value end)::int  as p_home,
      max(case when key = 'points_gym'      then value end)::int  as p_gym,
      max(case when key = 'points_class'    then value end)::int  as p_class,
      max(case when key = 'daily_point_cap' then value end)::int  as cap,
      max(case when key = 'start_date'      then value end)::date as start_d,
      max(case when key = 'end_date'        then value end)::date as end_d
    from settings
  ),
  per_day as (
    select w.user_id, w.date, count(*) as n,
           least(sum(case w.location when 'home' then s.p_home
                                     when 'gym'  then s.p_gym
                                     else s.p_class end),
                 coalesce(nullif(s.cap, 0), 1000000)) as pts
    from workouts w cross join s
    where w.date between s.start_d and s.end_d
    group by w.user_id, w.date, s.cap
  )
  select p.id, p.first_name, left(p.last_name, 1), p.avatar_url,
         coalesce(sum(d.pts), 0)::int, coalesce(sum(d.n), 0)::int, count(d.date)::int
  from profiles p
  left join per_day d on d.user_id = p.id
  where auth.uid() is not null
  group by p.id
  order by 5 desc, 6 desc, p.first_name;
$$;
revoke execute on function public.leaderboard() from anon, public;
grant execute on function public.leaderboard() to authenticated;

-- ---------- Photo storage -------------------------------------------
-- avatars: public (profile pics shown on leaderboard)
-- content: public (announcement / recipe images, admins upload)
-- private: progress photos + InBody printouts (owner + admins only)
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('content', 'content', true),
  ('private', 'private', false)
on conflict (id) do nothing;

create policy "avatars: owner writes" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: owner deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "content: admins write" on storage.objects
  for insert to authenticated with check (bucket_id = 'content' and public.is_admin());
create policy "content: admins delete" on storage.objects
  for delete to authenticated using (bucket_id = 'content' and public.is_admin());

create policy "private: owner or admin reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'private' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "private: owner writes" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'private' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "private: owner deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'private' and (storage.foldername(name))[1] = auth.uid()::text);
