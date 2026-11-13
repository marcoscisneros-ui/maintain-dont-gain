"use client";

/**
 * Blind weigh-ins: members can hide their weight and only see whether it went up or down.
 * The reveal code is stored as a SHA-256 fingerprint, never the code itself.
 */
export async function revealHash(userId: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`mdg-reveal:${userId}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type Scan = { weight: number };
export type Trend = { emoji: string; text: string; tone: "good" | "neutral" | "warn" };

/** Latest vs. previous weigh-in. */
export function lastChange(scans: Scan[]): Trend | null {
  if (scans.length < 2) return null;
  const d = Number(scans[scans.length - 1].weight) - Number(scans[scans.length - 2].weight);
  if (d <= -0.5) return { emoji: "⬇️", text: "Down since your last weigh-in", tone: "good" };
  if (d >= 0.5) return { emoji: "⬆️", text: "Up since your last weigh-in", tone: "warn" };
  return { emoji: "➡️", text: "About the same as last time", tone: "good" };
}

/** Latest vs. first weigh-in (the challenge goal: within 1 lb of the start). */
export function sinceStart(scans: Scan[]): Trend | null {
  if (scans.length < 2) return null;
  const d = Number(scans[scans.length - 1].weight) - Number(scans[0].weight);
  if (d < -1) return { emoji: "🎉", text: "Down since you started", tone: "good" };
  if (d <= 1) return { emoji: "✅", text: "Holding the line", tone: "good" };
  return { emoji: "💪", text: "Up a little since you started. You've got this", tone: "warn" };
}
