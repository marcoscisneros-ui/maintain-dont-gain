-- =====================================================================
-- Maintain, Don't Gain — update: phone numbers + 5 workout days per spin
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

-- Phone number (visible only to the member and staff, like everything else on the profile).
alter table public.profiles add column if not exists phone text;
grant update (phone) on public.profiles to authenticated;

-- Prize wheel: 5 different workout days in a week (Mon–Sun) earns a spin.
insert into public.settings (key, value) values ('spin_min_days', '5')
on conflict (key) do update set value = '5';

notify pgrst, 'reload schema';
