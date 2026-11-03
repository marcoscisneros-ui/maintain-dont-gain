export type Tier = "free" | "gold" | "diamond";
export type TierStatus = "pending" | "confirmed";

export const TIERS: Record<Tier, { label: string; sessions: number; emoji: string; blurb: string }> = {
  free: { label: "Free", sessions: 0, emoji: "⭐", blurb: "The full challenge: app, daily coaching, leaderboard and prizes." },
  gold: { label: "Gold", sessions: 4, emoji: "🥇", blurb: "Everything in Free + 4 personal training sessions." },
  diamond: { label: "Diamond", sessions: 8, emoji: "💎", blurb: "Everything in Free + 8 personal training sessions." },
};

export const TIER_ORDER: Tier[] = ["free", "gold", "diamond"];

export function sessionsLeft(p: { tier: Tier; tier_status: TierStatus; sessions_used: number }): number | null {
  const total = TIERS[p.tier]?.sessions ?? 0;
  if (!total || p.tier_status !== "confirmed") return null;
  return Math.max(0, total - p.sessions_used);
}
