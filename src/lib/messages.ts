"use client";

import { supabase } from "./supabase";

export type InboxItem = {
  message_id: number;
  read_at: string | null;
  messages: { id: number; title: string | null; body: string; created_at: string } | null;
};

export async function loadInbox(userId: string): Promise<InboxItem[]> {
  const { data, error } = await supabase()
    .from("message_recipients")
    .select("message_id, read_at, messages(id, title, body, created_at)")
    .eq("user_id", userId);
  if (error) return []; // messages update not installed yet
  return ((data ?? []) as unknown as InboxItem[])
    .filter((i) => i.messages)
    .sort((a, b) => b.messages!.created_at.localeCompare(a.messages!.created_at));
}

export async function markRead(userId: string, ids: number[]) {
  if (!ids.length) return;
  await supabase().from("message_recipients").update({ read_at: new Date().toISOString() }).eq("user_id", userId).in("message_id", ids);
}

/** Open the phone's texting app with these numbers and message filled in. */
export function smsLink(numbers: string[], body: string): string {
  const ios = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const to = numbers.join(",");
  const b = encodeURIComponent(body);
  if (ios) return numbers.length > 1 ? `sms:/open?addresses=${to}&body=${b}` : `sms:${to}&body=${b}`;
  return `sms:${to}?body=${b}`;
}
