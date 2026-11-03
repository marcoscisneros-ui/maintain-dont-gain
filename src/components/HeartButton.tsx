"use client";

import { Heart } from "lucide-react";
import { cn } from "./ui";
import type { HeartState } from "@/lib/engagement";

/** ❤️ for the daily message. Optimistic: flips instantly, count updates with it. */
export function HeartButton({
  state,
  onToggle,
  className,
}: {
  state: HeartState;
  onToggle: () => void;
  className?: string;
}) {
  const { hearted, count } = state;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={hearted}
      aria-label={hearted ? "Remove heart" : "Heart this message"}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ring-1 transition active:scale-95",
        hearted ? "bg-brand/10 text-brand ring-brand/30" : "bg-card-2 text-muted ring-line",
        className,
      )}
    >
      <Heart key={String(hearted)} className={cn("size-5", hearted && "pop fill-current")} strokeWidth={hearted ? 0 : 2} />
      {count > 0 ? count : hearted ? 1 : "Love it"}
    </button>
  );
}
