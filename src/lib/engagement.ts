"use client";

import { supabase } from "./supabase";

export type HeartState = { hearted: boolean; count: number };

/**
 * Record that this member saw today's message (first time only), and
 * return whether they've hearted it plus the total heart count.
 */
export async function markSeenAndLoad(userId: string, contentId: number): Promise<HeartState> {
  const sb = supabase();
  await sb
    .from("daily_engagement")
    .upsert({ user_id: userId, content_id: contentId }, { onConflict: "user_id,content_id", ignoreDuplicates: true });
  const [mine, total] = await Promise.all([
    sb.from("daily_engagement").select("hearted").eq("user_id", userId).eq("content_id", contentId).maybeSingle(),
    sb.rpc("daily_hearts", { cid: contentId }),
  ]);
  return { hearted: !!mine.data?.hearted, count: typeof total.data === "number" ? total.data : 0 };
}

export async function setHeart(userId: string, contentId: number, hearted: boolean) {
  const { error } = await supabase()
    .from("daily_engagement")
    .upsert(
      { user_id: userId, content_id: contentId, hearted, hearted_at: hearted ? new Date().toISOString() : null },
      { onConflict: "user_id,content_id" },
    );
  if (error) throw error;
}
