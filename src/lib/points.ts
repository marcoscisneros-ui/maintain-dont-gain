import type { Settings } from "./settings";

export type Location = "home" | "gym" | "class" | "pt";

export const LOCATIONS: { id: Location; label: string; emoji: string }[] = [
  { id: "home", label: "At home", emoji: "🏠" },
  { id: "gym", label: "At the gym", emoji: "🏋️" },
  { id: "class", label: "Took a class", emoji: "🔥" },
  { id: "pt", label: "Personal training", emoji: "🤝" },
];

export function pointValues(s: Settings): Record<Location, number> {
  return {
    home: Number(s.points_home) || 0,
    gym: Number(s.points_gym) || 0,
    class: Number(s.points_class) || 0,
    pt: Number(s.points_pt ?? 5) || 0,
  };
}

export function dailyCap(s: Settings): number {
  return Number(s.daily_point_cap) || Infinity;
}

/** Points for one day's workouts, after the daily cap. Only days inside the challenge count. */
export function pointsForDay(locations: string[], date: string, s: Settings): number {
  if (date < s.start_date || date > s.end_date) return 0;
  const v = pointValues(s);
  const raw = locations.reduce((sum, l) => sum + (v[l as Location] ?? 0), 0);
  return Math.min(raw, dailyCap(s));
}
