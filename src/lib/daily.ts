"use client";

import { supabase } from "./supabase";
import type { ProgramStatus } from "./dates";

export type DailyItem = { id: number; kind: "coach" | "tip"; position: number; title: string | null; body: string };

/**
 * Today's coach message + tip. Rotates automatically by program day:
 * day 1 shows item #1, day 2 shows item #2, ... (wraps around if the bank runs short).
 * Before kickoff there's no daily coach message (the app shows a welcome note instead).
 */
export async function loadDaily(status: ProgramStatus): Promise<{ coach: DailyItem | null; tip: DailyItem | null }> {
  const { data } = await supabase().from("daily_content").select("*").order("position").order("id");
  const items = (data ?? []) as DailyItem[];
  const pick = (kind: DailyItem["kind"]) => {
    const list = items.filter((i) => i.kind === kind);
    return list.length ? list[(status.day - 1) % list.length] : null;
  };
  return { coach: status.phase === "before" ? null : pick("coach"), tip: pick("tip") };
}

export function welcomeFallback(coachName: string) {
  return `Welcome to Maintain, Don't Gain! The holidays don't have to mean starting over in January. Log a little every day, show up when you can, and let's walk into the new year exactly where we started, or better. I'm in this with you. – ${coachName}`;
}
