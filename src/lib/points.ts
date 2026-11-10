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

export function bonusDays(s: Settings): string[] {
  return (s.bonus_days || "").split(",").map((d) => d.trim()).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
}

/** 1 on normal days; the bonus multiplier (2 = double points) on bonus days. */
export function multiplierFor(date: string, s: Settings): number {
  return bonusDays(s).includes(date) ? Math.max(1, Number(s.bonus_multiplier) || 2) : 1;
}

/** Points for one day's workouts: capped, then multiplied on bonus days. Only challenge days count. */
export function pointsForDay(locations: string[], date: string, s: Settings): number {
  if (date < s.start_date || date > s.end_date) return 0;
  const v = pointValues(s);
  const raw = locations.reduce((sum, l) => sum + (v[l as Location] ?? 0), 0);
  return Math.min(raw, dailyCap(s)) * multiplierFor(date, s);
}
