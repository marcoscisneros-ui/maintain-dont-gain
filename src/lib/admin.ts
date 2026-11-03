"use client";

import { supabase, type Profile } from "./supabase";
import { addDays, todayISO } from "./dates";
import { pointsForDay } from "./points";
import { compressImage } from "./image";
import type { Settings } from "./settings";
import { TIERS } from "./tiers";

/** Supabase returns at most 1,000 rows per request, so page through everything. */
export async function fetchAll<T>(table: string, select: string, orderBy: string): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await supabase().from(table).select(select).order(orderBy).range(from, from + size - 1);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < size) break;
  }
  return out;
}

export type Meal = { user_id: string; date: string; name: string; calories: number; protein: number | null; carbs: number | null; fat: number | null };
export type Steps = { user_id: string; date: string; steps: number };
export type Workout = { user_id: string; date: string; location: string; activity: string; minutes: number | null; notes: string | null; rating: number | null };
export type Scan = { id: number; user_id: string; date: string; weight: number; body_fat_pct: number | null; smm: number | null; visceral_fat: number | null; photo_path: string | null };

export type AllData = { profiles: Profile[]; meals: Meal[]; steps: Steps[]; workouts: Workout[]; scans: Scan[] };

export async function loadAllData(): Promise<AllData> {
  const [profiles, meals, steps, workouts, scans] = await Promise.all([
    fetchAll<Profile>("profiles", "*", "created_at"),
    fetchAll<Meal>("meals", "user_id,date,name,calories,protein,carbs,fat", "id"),
    fetchAll<Steps>("daily_steps", "user_id,date,steps", "date"),
    fetchAll<Workout>("workouts", "user_id,date,location,activity,minutes,notes,rating", "id"),
    fetchAll<Scan>("inbody_scans", "*", "id"),
  ]);
  return { profiles, meals, steps, workouts, scans };
}

export type MemberStats = {
  profile: Profile;
  points: number;
  workouts: number;
  daysLogged: number;
  streak: number;
  loggedToday: boolean;
  firstScan: Scan | null;
  lastScan: Scan | null;
  weightChange: number | null;
  bodyFatChange: number | null;
  smmChange: number | null;
  visceralChange: number | null;
  scans: Scan[];
};

const delta = (a: number | null | undefined, b: number | null | undefined) =>
  a == null || b == null ? null : Math.round((Number(b) - Number(a)) * 10) / 10;

function firstLast<K extends "body_fat_pct" | "smm" | "visceral_fat">(scans: Scan[], k: K) {
  const vals = scans.filter((s) => s[k] != null);
  return delta(vals[0]?.[k], vals.length > 1 ? vals[vals.length - 1][k] : null);
}

export function computeStats(d: AllData, settings: Settings): MemberStats[] {
  const today = todayISO();
  const by = <T extends { user_id: string }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) m.set(r.user_id, [...(m.get(r.user_id) ?? []), r]);
    return m;
  };
  const meals = by(d.meals), steps = by(d.steps), workouts = by(d.workouts), scans = by(d.scans);

  return d.profiles.map((p) => {
    const w = workouts.get(p.id) ?? [];
    const sc = (scans.get(p.id) ?? []).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    const days = new Set<string>([
      ...(meals.get(p.id) ?? []).map((x) => x.date),
      ...(steps.get(p.id) ?? []).map((x) => x.date),
      ...w.map((x) => x.date),
      ...sc.map((x) => x.date),
    ]);
    // streak: consecutive logged days ending today (or yesterday, if today isn't logged yet)
    let cursor = days.has(today) ? today : addDays(today, -1);
    let streak = 0;
    while (days.has(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    const byDay = new Map<string, string[]>();
    for (const x of w) byDay.set(x.date, [...(byDay.get(x.date) ?? []), x.location]);
    const points = [...byDay].reduce((s, [date, locs]) => s + pointsForDay(locs, date, settings), 0);
    const first = sc[0] ?? null;
    const last = sc.length > 1 ? sc[sc.length - 1] : null;
    return {
      profile: p,
      points,
      workouts: w.length,
      daysLogged: [...days].filter((x) => x >= settings.start_date && x <= settings.end_date).length,
      streak,
      loggedToday: days.has(today),
      firstScan: first,
      lastScan: last,
      weightChange: delta(first?.weight, last?.weight),
      bodyFatChange: firstLast(sc, "body_fat_pct"),
      smmChange: firstLast(sc, "smm"),
      visceralChange: firstLast(sc, "visceral_fat"),
      scans: sc,
    };
  });
}

// ---------- CSV ----------
function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function summaryCSV(stats: MemberStats[]): string {
  return toCSV(
    ["First name", "Last name", "Username", "Tier", "Tier status", "PT sessions used", "PT sessions total", "Admin", "Joined", "Last seen", "Height (in)", "Points", "Workouts", "Days logged", "Current streak",
     "Start weight (lbs)", "Latest weight (lbs)", "Weight change (lbs)", "Body fat change (%)", "SMM change (lbs)", "Visceral fat change", "Calorie target", "Step goal"],
    stats.map((s) => [
      s.profile.first_name, s.profile.last_name, s.profile.username,
      TIERS[s.profile.tier ?? "free"].label, s.profile.tier_status ?? "confirmed", s.profile.sessions_used ?? 0, TIERS[s.profile.tier ?? "free"].sessions,
      s.profile.is_admin ? "yes" : "",
      s.profile.created_at.slice(0, 10), s.profile.last_seen_at.slice(0, 16).replace("T", " "), s.profile.height_in,
      s.points, s.workouts, s.daysLogged, s.streak,
      s.firstScan?.weight ?? s.profile.start_weight, s.lastScan?.weight ?? "", s.weightChange, s.bodyFatChange, s.smmChange, s.visceralChange,
      s.profile.calorie_target, s.profile.step_goal,
    ]),
  );
}

export function logsCSV(d: AllData): string {
  const name = new Map(d.profiles.map((p) => [p.id, [`${p.first_name} ${p.last_name}`, p.username]]));
  const rows: unknown[][] = [];
  for (const m of d.meals) rows.push([...name.get(m.user_id)!, m.date, "Food", m.name, m.calories, m.protein, m.carbs, m.fat, "", "", "", "", "", "", ""]);
  for (const s of d.steps) rows.push([...name.get(s.user_id)!, s.date, "Steps", "", "", "", "", "", s.steps, "", "", "", "", "", ""]);
  for (const w of d.workouts) rows.push([...name.get(w.user_id)!, w.date, "Workout", [w.activity, w.notes].filter(Boolean).join(" – "), "", "", "", "", "", w.location, w.minutes, "", "", "", "", w.rating]);
  for (const s of d.scans) rows.push([...name.get(s.user_id)!, s.date, "Weigh-in", "", "", "", "", "", "", "", "", s.weight, s.body_fat_pct, s.smm, s.visceral_fat]);
  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[2]).localeCompare(String(b[2])));
  return toCSV(
    ["Member", "Username", "Date", "Type", "Description", "Calories", "Protein (g)", "Carbs (g)", "Fat (g)", "Steps", "Workout location", "Minutes", "Weight (lbs)", "Body fat (%)", "SMM (lbs)", "Visceral fat", "Rating (1-5)"],
    rows,
  );
}

// ---------- server actions (PIN reset, admin, remove) ----------
export async function adminAction(
  action: "reset_pin" | "set_admin" | "delete_member" | "set_tier" | "adjust_sessions",
  userId: string,
  extra: { pin?: string; value?: boolean; tier?: string; status?: string; delta?: number } = {},
) {
  const { data } = await supabase().auth.getSession();
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify({ action, userId, ...extra }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Something went wrong");
  return json;
}

/** Upload an image for posts / recipes / coach photo to the public "content" bucket. */
export async function uploadContentImage(file: File, folder: string, maxSize = 1600): Promise<string> {
  const blob = await compressImage(file, maxSize, 0.85);
  const path = `${folder}/${Date.now()}.jpg`;
  const sb = supabase();
  const { error } = await sb.storage.from("content").upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return sb.storage.from("content").getPublicUrl(path).data.publicUrl;
}
