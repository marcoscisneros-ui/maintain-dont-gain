-- =====================================================================
-- Maintain, Don't Gain — update: free InBody scan vouchers
-- Every member gets 3: two ready at sign-up, one that unlocks in the final week.
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

create table if not exists public.vouchers (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles on delete cascade,
  kind        text not null default 'inbody',
  slot        int  not null,                       -- 1, 2, 3
  final_week  boolean not null default false,      -- true = locked until the last week of the challenge
  code        text not null unique,                -- e.g. IB-7K3Q
  created_at  timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references public.profiles on delete set null,
  unique (user_id, kind, slot)
);

alter table public.vouchers enable row level security;
drop policy if exists "vouchers: read own or admin" on public.vouchers;
drop policy if exists "vouchers: admins mark used" on public.vouchers;
create policy "vouchers: read own or admin" on public.vouchers for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "vouchers: admins mark used" on public.vouchers for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.vouchers from anon;
revoke insert, update, delete on public.vouchers from authenticated;
grant update (redeemed_at, redeemed_by) on public.vouchers to authenticated;

-- A short code staff can read out loud (no 0/O or 1/I/L mix-ups).
create or replace function public.voucher_code(prefix text) returns text
language plpgsql volatile as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  c text := '';
begin
  for i in 1..4 loop
    c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return prefix || '-' || c;
end $$;

-- Give a member their 3 InBody vouchers (skips any they already have).
create or replace function public.issue_inbody_vouchers(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  s int;
begin
  for s in 1..3 loop
    if not exists (select 1 from vouchers where user_id = uid and kind = 'inbody' and slot = s) then
      loop
        begin
          insert into vouchers (user_id, kind, slot, final_week, code)
          values (uid, 'inbody', s, s = 3, voucher_code('IB'));
          exit;
        exception when unique_violation then
          -- code collision: try another code
        end;
      end loop;
    end if;
  end loop;
end $$;
revoke execute on function public.issue_inbody_vouchers(uuid) from anon, authenticated, public;

-- New members get theirs automatically.
create or replace function public.on_profile_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.issue_inbody_vouchers(new.id);
  return new;
end $$;
drop trigger if exists profiles_issue_vouchers on public.profiles;
create trigger profiles_issue_vouchers after insert on public.profiles
  for each row execute function public.on_profile_created();

-- Everyone who already joined.
select public.issue_inbody_vouchers(id) from public.profiles;

notify pgrst, 'reload schema';
