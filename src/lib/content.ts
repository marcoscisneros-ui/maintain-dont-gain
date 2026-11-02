"use client";

import { supabase } from "./supabase";
import { TZ } from "./dates";

export type Announcement = {
  id: number;
  kind: "news" | "event";
  title: string;
  body: string;
  image_url: string | null;
  event_at: string | null;
  pinned: boolean;
  created_at: string;
};

export type LibraryItem = {
  id: number;
  kind: "recipe" | "tip";
  title: string;
  category: string;
  body: string;
  image_url: string | null;
  created_at: string;
};

export async function loadAnnouncements(): Promise<Announcement[]> {
  const { data } = await supabase().from("announcements").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Announcement[];
}

/** Upcoming events (soonest first) + news (pinned first, then newest). Past events drop off. */
export function splitFeed(all: Announcement[], now = new Date()) {
  const cutoff = now.getTime() - 3 * 60 * 60 * 1000; // keep an event visible until ~3h after it starts
  const events = all
    .filter((a) => a.kind === "event" && (!a.event_at || Date.parse(a.event_at) >= cutoff))
    .sort((a, b) => Date.parse(a.event_at ?? a.created_at) - Date.parse(b.event_at ?? b.created_at));
  const news = all
    .filter((a) => a.kind === "news")
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.created_at) - Date.parse(a.created_at));
  return { events, news };
}

export function formatEventTime(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-US", { timeZone: TZ, month: "short" }).toUpperCase(),
    day: d.toLocaleDateString("en-US", { timeZone: TZ, day: "numeric" }),
    full: d.toLocaleString("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }),
  };
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, month: "short", day: "numeric" });
}

const SEEN_KEY = "mdg-news-seen";
export function lastSeenNews(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}
export function markNewsSeen(latestId: number) {
  try {
    localStorage.setItem(SEEN_KEY, String(latestId));
  } catch {}
}
