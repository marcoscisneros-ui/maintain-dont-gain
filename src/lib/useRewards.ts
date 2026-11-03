"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, type Profile } from "./supabase";
import type { Settings } from "./settings";
import { todayISO } from "./dates";
import { unspentWeeks, weekStart, weeklyProgress, type Prize, type Spin, type WeekProgress } from "./rewards";

export type RewardsState = {
  minDays: number;
  weeks: WeekProgress[];
  thisWeek: { start: string; days: string[] };
  available: string[];
  spins: Spin[];
  prizes: Prize[];
};

/** Everything the Rewards screen and the Home card need. */
export function useRewards(profile: Profile | null, settings: Settings | null) {
  const [state, setState] = useState<RewardsState | null>(null);

  const load = useCallback(async () => {
    if (!profile || !settings) return;
    const sb = supabase();
    const [w, s, p] = await Promise.all([
      sb.from("workouts").select("date").eq("user_id", profile.id),
      sb.from("spins").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
      sb.from("prizes").select("id,name,weight,active").order("id"),
    ]);
    if (s.error || p.error) return; // rewards update not installed yet: hide quietly
    const dates = (w.data ?? []).map((x) => x.date as string);
    const minDays = Number(settings.spin_min_days) || 4;
    const weeks = weeklyProgress(dates, settings.start_date, settings.end_date, minDays);
    const start = weekStart(todayISO());
    setState({
      minDays,
      weeks,
      thisWeek: { start, days: [...new Set(dates.filter((d) => d >= start && d >= settings.start_date && d <= settings.end_date))] },
      available: unspentWeeks(weeks, (s.data ?? []) as Spin[]),
      spins: (s.data ?? []) as Spin[],
      prizes: (p.data ?? []) as Prize[],
    });
  }, [profile, settings]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: load };
}
