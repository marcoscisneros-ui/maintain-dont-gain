"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatDate, todayISO } from "@/lib/dates";
import { cn } from "./ui";

/** "‹ Today ›" — step back to log a missed day. Can't go past today. */
export function DatePager({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const today = todayISO();
  const label =
    value === today ? "Today" : value === addDays(today, -1) ? "Yesterday" : formatDate(value, { weekday: "short", month: "short", day: "numeric" });
  const atToday = value >= today;
  return (
    <div className="flex items-center justify-between rounded-2xl bg-card p-1.5 shadow-card ring-1 ring-line/60">
      <button
        onClick={() => onChange(addDays(value, -1))}
        className="flex size-10 items-center justify-center rounded-xl text-muted active:bg-card-2"
        aria-label="Previous day"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="font-semibold">{label}</span>
      <button
        onClick={() => !atToday && onChange(addDays(value, 1))}
        className={cn("flex size-10 items-center justify-center rounded-xl text-muted active:bg-card-2", atToday && "invisible")}
        aria-label="Next day"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
