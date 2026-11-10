"use client";

import { supabase } from "./supabase";
import { addDays, todayISO } from "./dates";

/**
 * Days in a row with anything logged (food, steps, workout or weigh-in).
 * Counts back from today, or from yesterday if today isn't logged yet (so it's still "alive").
 */
export async function loadStreak(userId: string): Promise<{ streak: number; loggedToday: boolean }> {
  const today = todayISO();
  const since = addDays(today, -60);
  const sb = supabase();
  const q = (t: string) => sb.from(t).select("date").eq("user_id", userId).gte("date", since);
  const res = await Promise.all([q("meals"), q("daily_steps"), q("workouts"), q("inbody_scans")]);
  const days = new Set(res.flatMap((r) => (r.data ?? []).map((x) => x.date as string)));
  const loggedToday = days.has(today);
  let cursor = loggedToday ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return { streak, loggedToday };
}
