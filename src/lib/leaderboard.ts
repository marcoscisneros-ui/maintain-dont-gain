"use client";

import { supabase } from "./supabase";
import type { Tier } from "./tiers";

export type Row = {
  user_id: string;
  first_name: string;
  last_initial: string;
  avatar_url: string | null;
  points: number;
  workouts: number;
  active_days: number;
  tier?: Tier;
};

export async function loadLeaderboard(): Promise<Row[]> {
  const { data } = await supabase().rpc("leaderboard");
  return (data ?? []) as Row[];
}

/** Rank with ties: 10, 8, 8, 5 → 1, 2, 2, 4 */
export function ranks(rows: Row[]): number[] {
  return rows.map((r, i) => (i > 0 && rows[i - 1].points === r.points ? -1 : i + 1)).reduce<number[]>((acc, v, i) => {
    acc.push(v === -1 ? acc[i - 1] : v);
    return acc;
  }, []);
}
