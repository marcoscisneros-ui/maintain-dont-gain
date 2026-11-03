// Shared by the app and the server, so both agree on who has earned a spin.
import { addDays } from "./dates";

export type Prize = { id: number; name: string; weight: number; active: boolean };
export type Spin = {
  id: number;
  user_id: string;
  week_start: string;
  prize_id: number | null;
  prize_name: string;
  code: string;
  created_at: string;
  redeemed_at: string | null;
};

/** Monday of the week containing this date (weeks run Monday–Sunday). */
export function weekStart(iso: string): string {
  const dow = (new Date(iso + "T00:00:00Z").getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  return addDays(iso, -dow);
}

export type WeekProgress = { weekStart: string; days: number; earned: boolean };

/**
 * Workout DAYS per challenge week (several workouts on one day count once).
 * Only days inside the challenge count.
 */
export function weeklyProgress(workoutDates: string[], start: string, end: string, minDays: number): WeekProgress[] {
  const byWeek = new Map<string, Set<string>>();
  for (const d of workoutDates) {
    if (d < start || d > end) continue;
    const w = weekStart(d);
    byWeek.set(w, (byWeek.get(w) ?? new Set()).add(d));
  }
  const weeks: WeekProgress[] = [];
  for (let w = weekStart(start); w <= end; w = addDays(w, 7)) {
    const days = byWeek.get(w)?.size ?? 0;
    weeks.push({ weekStart: w, days, earned: days >= minDays });
  }
  return weeks;
}

/** Weeks that earned a spin but haven't been spun yet, oldest first. */
export function unspentWeeks(progress: WeekProgress[], spins: { week_start: string }[]): string[] {
  const spun = new Set(spins.map((s) => s.week_start));
  return progress.filter((w) => w.earned && !spun.has(w.weekStart)).map((w) => w.weekStart);
}

/** Weighted random pick: weight 30 is three times as likely as weight 10. */
export function pickPrize(prizes: Prize[], rand: number = Math.random()): Prize | null {
  const pool = prizes.filter((p) => p.active && p.weight > 0);
  const total = pool.reduce((s, p) => s + p.weight, 0);
  if (!total) return null;
  let r = rand * total;
  for (const p of pool) {
    if ((r -= p.weight) < 0) return p;
  }
  return pool[pool.length - 1];
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I/L mix-ups at the front desk
export function certificateCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `MDG-${s}`;
}
