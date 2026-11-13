-- =====================================================================
-- Maintain, Don't Gain — update: blind weigh-ins (hide my weight)
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

-- Member's choice: hide weight numbers, and a reveal code (stored as a fingerprint, never the code itself).
alter table public.profiles add column if not exists blind_weight boolean not null default false;
alter table public.profiles add column if not exists reveal_hash text;
grant update (blind_weight, reveal_hash) on public.profiles to authenticated;

-- Staff can enter (and fix) weigh-ins for any member.
drop policy if exists "inbody_scans: admins add" on public.inbody_scans;
drop policy if exists "inbody_scans: admins delete" on public.inbody_scans;
create policy "inbody_scans: admins add" on public.inbody_scans for insert to authenticated with check (public.is_admin());
create policy "inbody_scans: admins delete" on public.inbody_scans for delete to authenticated using (public.is_admin());

notify pgrst, 'reload schema';
