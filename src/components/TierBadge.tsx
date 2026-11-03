import { cn } from "./ui";
import { TIERS, type Tier } from "@/lib/tiers";

/** Small Gold / Diamond pill. Free shows nothing unless `showFree`. */
export function TierBadge({ tier, pending, showFree, className }: { tier: Tier; pending?: boolean; showFree?: boolean; className?: string }) {
  if (tier === "free" && !showFree) return null;
  const style =
    tier === "diamond"
      ? "bg-gradient-to-r from-sky-400/20 to-violet/25 text-violet ring-violet/30"
      : tier === "gold"
        ? "bg-gold/15 text-gold ring-gold/35"
        : "bg-card-2 text-muted ring-line";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 align-middle", style, pending && "opacity-60", className)}>
      {TIERS[tier].emoji} {TIERS[tier].label}
      {pending && " · pending"}
    </span>
  );
}
