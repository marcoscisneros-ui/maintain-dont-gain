// Shared by the app and the server, so both agree on who has earned a spin.
import { addDays } from "./dates";

export type Prize = {
  id: number;
  name: string;
  weight: number; // size of EACH slice
  active: boolean;
  slots?: number; // how many times it appears on the wheel
  emoji?: string;
  short_name?: string | null;
};

const slotsOf = (p: Prize) => Math.max(1, Math.min(6, p.slots ?? 1));
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

/** Chance of each prize = slots × slice size. Exactly matches how much of the wheel it covers. */
export function prizeShare(p: Prize): number {
  return p.active && p.weight > 0 ? slotsOf(p) * p.weight : 0;
}

/** Weighted random pick, matching the wheel. */
export function pickPrize(prizes: Prize[], rand: number = Math.random()): Prize | null {
  const pool = prizes.filter((p) => prizeShare(p) > 0);
  const total = pool.reduce((s, p) => s + prizeShare(p), 0);
  if (!total) return null;
  let r = rand * total;
  for (const p of pool) {
    if ((r -= prizeShare(p)) < 0) return p;
  }
  return pool[pool.length - 1];
}

export type WheelSlice = { prize: Prize; a0: number; a1: number; mid: number; index: number };

/**
 * Lay out the wheel: each prize appears `slots` times, spread around the circle so the
 * same prize isn't bunched together. Slice size = prize weight.
 */
export function buildWheel(prizes: Prize[]): WheelSlice[] {
  const pool = prizes.filter((p) => prizeShare(p) > 0).sort((a, b) => slotsOf(b) - slotsOf(a) || b.weight - a.weight);
  const n = pool.reduce((s, p) => s + slotsOf(p), 0);
  const order: (Prize | null)[] = Array(n).fill(null);
  pool.forEach((p, pi) => {
    const k = slotsOf(p);
    for (let j = 0; j < k; j++) {
      let pos = Math.floor((j * n) / k + pi) % n; // evenly spaced, offset per prize
      while (order[pos]) pos = (pos + 1) % n;
      order[pos] = p;
    }
  });
  // avoid two of the same prize side by side where a swap fixes it
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    if (n > 2 && order[i]!.id === order[next]!.id) {
      for (let j = 0; j < n; j++) {
        const a = order[j]!, prev = order[(j - 1 + n) % n]!, after = order[(j + 1) % n]!;
        if (a.id !== order[i]!.id && prev.id !== order[i]!.id && after.id !== order[i]!.id &&
            order[(next + 1) % n]!.id !== a.id && order[i]!.id !== a.id) {
          [order[next], order[j]] = [order[j], order[next]];
          break;
        }
      }
    }
  }
  const total = order.reduce((s, p) => s + p!.weight, 0) || 1;
  let a = 0;
  return order.map((p, index) => {
    const sweep = (p!.weight / total) * 360;
    const slice = { prize: p!, a0: a, a1: a + sweep, mid: a + sweep / 2, index };
    a += sweep;
    return slice;
  });
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I/L mix-ups at the front desk
export function certificateCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `MDG-${s}`;
}
