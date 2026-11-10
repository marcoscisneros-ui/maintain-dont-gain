"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type Settings = {
  start_date: string;
  end_date: string;
  coach_name: string;
  coach_title: string;
  coach_photo_url: string;
  groupme_url: string;
  facebook_url: string;
  class_url: string;
  class_url_ios: string;
  class_url_android: string;
  join_code?: string;
  points_home: string;
  points_gym: string;
  points_class: string;
  points_pt: string;
  class_names: string;
  spin_min_days: string;
  bonus_days: string;
  bonus_multiplier: string;
  daily_point_cap: string;
};

export const DEFAULT_SETTINGS: Settings = {
  start_date: "2026-11-16",
  end_date: "2027-01-03",
  coach_name: "Marcos",
  coach_title: "Managing Partner",
  coach_photo_url: "",
  groupme_url: "",
  facebook_url: "",
  class_url: "",
  class_url_ios: "",
  class_url_android: "",
  points_home: "1",
  points_gym: "2",
  points_class: "3",
  points_pt: "5",
  spin_min_days: "5",
  bonus_days: "",
  bonus_multiplier: "2",
  class_names: "Cycle, HIIT, Strength, Bootcamp, Yoga, Pilates, Boxing, Dance, Core, Stretch",
  daily_point_cap: "5",
};

let cache: Settings | null = null;
let inflight: Promise<Settings> | null = null;

export function loadSettings(force = false): Promise<Settings> {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = (async () => {
    const { data } = await supabase().from("settings").select("key,value");
    const s = { ...DEFAULT_SETTINGS } as Record<string, string>;
    for (const row of data ?? []) s[row.key] = row.value;
    cache = s as Settings;
    inflight = null;
    return cache;
  })();
  return inflight;
}

export function useSettings(): Settings | null {
  const [s, setS] = useState<Settings | null>(cache);
  useEffect(() => {
    let alive = true;
    loadSettings().then((v) => alive && setS(v));
    return () => {
      alive = false;
    };
  }, []);
  return s;
}
