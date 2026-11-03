-- =====================================================================
-- Maintain, Don't Gain — update: real prize list + repeated wheel slices
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

-- A prize can appear several times around the wheel ("slots").
-- weight = size of EACH slice. Chance of a prize = slots × weight ÷ total.
alter table public.prizes add column if not exists slots int not null default 1 check (slots between 1 and 6);
alter table public.prizes add column if not exists emoji text not null default '🎁';
alter table public.prizes add column if not exists short_name text;  -- shorter label for the wheel

-- Remove the 5 placeholder prizes (certificates already won keep their prize name).
delete from public.prizes where name in (
  'Free smoothie or drink', 'Bring-a-friend guest pass', 'Entry into the grand prize raffle',
  'Gym swag item', 'Free 30-min personal training session'
);

-- The real prize list (added only if not already there).
insert into public.prizes (name, short_name, emoji, slots, weight)
select v.name, v.short_name, v.emoji, v.slots, v.weight
from (values
  ('Crunch koozie',                'Koozie',        '🥫', 3, 10),
  ('Crunch water bottle',          'Water bottle',  '💧', 3, 10),
  ('Crunch mini backpack',         'Mini backpack', '🎒', 2, 10),
  ('20% off any supplement',       '20% off supps', '🏷️', 2,  7),
  ('Crunch shaker bottle',         'Shaker',        '🥤', 1,  6),
  ('Free Alani',                   'Free Alani',    '⚡', 1,  5),
  ('Free DotFit protein bar',      'Protein bar',   '🍫', 1,  5),
  ('Free multivitamin',            'Multivitamin',  '💊', 1,  3)
) as v(name, short_name, emoji, slots, weight)
where not exists (select 1 from public.prizes p where p.name = v.name);

notify pgrst, 'reload schema';
