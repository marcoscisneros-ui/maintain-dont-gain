"use client";

import { addDays, todayISO } from "./dates";
import type { Settings } from "./settings";

export type Voucher = {
  id: number;
  user_id: string;
  kind: string;
  slot: number;
  final_week: boolean;
  code: string;
  created_at: string;
  redeemed_at: string | null;
};

/** The final-week voucher unlocks on the first day of the challenge's last 7 days. */
export function finalWeekStart(s: Settings): string {
  return addDays(s.end_date, -6);
}

export function isUnlocked(v: Voucher, s: Settings, today = todayISO()): boolean {
  return !v.final_week || today >= finalWeekStart(s);
}
