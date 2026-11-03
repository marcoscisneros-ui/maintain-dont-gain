-- =====================================================================
-- Maintain, Don't Gain — update: height + visceral fat
-- Paste into Supabase → SQL Editor → New query → Run (once).
-- Safe to run more than once.
-- =====================================================================

-- Height (in inches) lives on the member's profile; asked once.
alter table public.profiles add column if not exists height_in numeric(4,1);
grant update (height_in) on public.profiles to authenticated;

-- InBody visceral fat level (optional, like body fat % and SMM).
alter table public.inbody_scans add column if not exists visceral_fat numeric(4,1);

-- Tell the API about the new columns right away.
notify pgrst, 'reload schema';
