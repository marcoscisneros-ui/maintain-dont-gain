"use client";

import { supabase } from "./supabase";

export type DailyItem = { id: number; kind: "coach" | "tip"; position: number; title: string | null; body: string };

/**
 * Today's coach message + tip. Rotates automatically by program day:
 * day 1 shows item #1, day 2 shows item #2, ... (wraps around if the bank runs out).
 */
export async function loadDaily(day: number): Promise<{ coach: DailyItem | null; tip: DailyItem | null }> {
  const { data } = await supabase().from("daily_content").select("*").order("position").order("id");
  const items = (data ?? []) as DailyItem[];
  const pick = (kind: DailyItem["kind"]) => {
    const list = items.filter((i) => i.kind === kind);
    return list.length ? list[(day - 1) % list.length] : null;
  };
  return { coach: pick("coach"), tip: pick("tip") };
}
