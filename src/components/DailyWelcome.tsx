"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { Avatar } from "./Avatar";
import { Button } from "./ui";
import { JingleBells, SeasonalFall } from "./Seasonal";
import { HeartButton } from "./HeartButton";
import type { HeartState } from "@/lib/engagement";
import type { DailyItem } from "@/lib/daily";
import type { ProgramStatus } from "@/lib/dates";

/**
 * The once-a-day welcome pop-up: today's message from the coach + tip of the day.
 * Shows the first time a member opens the app each day (per phone).
 */
export function DailyWelcome({
  userId,
  date,
  status,
  coachName,
  coachTitle,
  coachPhoto,
  firstName,
  message,
  tip,
  heart,
  onHeart,
}: {
  userId: string;
  date: string;
  status: ProgramStatus;
  coachName: string;
  coachTitle: string;
  coachPhoto: string | null;
  firstName: string;
  message: string;
  tip: DailyItem | null;
  heart?: HeartState | null;
  onHeart?: () => void;
}) {
  const key = `mdg-welcome-${userId}-${date}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(key)) setOpen(true);
    } catch {
      /* private mode: just don't pop up */
    }
  }, [key]);

  function close() {
    try {
      localStorage.setItem(key, "1");
    } catch {}
    setOpen(false);
  }

  if (!open) return null;

  const badge =
    status.phase === "during"
      ? `Day ${status.day} of ${status.totalDays}`
      : status.phase === "before"
        ? `${status.daysUntilStart} day${status.daysUntilStart === 1 ? "" : "s"} to kickoff`
        : "Challenge complete";

  return (
    <div className="fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Today's message"
        onClick={(e) => e.stopPropagation()}
        className="pop max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-card pb-safe shadow-2xl sm:rounded-[28px]"
      >
        <div className="relative overflow-hidden brand-gradient px-6 pt-6 pb-14 text-white">
          <div aria-hidden className="absolute -top-12 -right-10 size-44 rounded-full bg-white/10" />
          <SeasonalFall count={14} />
          <JingleBells size={64} className="absolute top-4 right-4 drop-shadow-md" />
          <p className="relative pr-20 text-xs font-semibold tracking-[0.18em] uppercase opacity-85">{badge}</p>
          <p className="relative mt-2 pr-20 text-[26px] leading-tight font-bold">Good to see you, {firstName}!</p>
        </div>
        <div className="relative -mt-10 px-5">
          <div className="rounded-3xl bg-card p-5 shadow-card ring-1 ring-line/60">
            <div className="flex items-center gap-3">
              <Avatar url={coachPhoto} name={coachName} size={48} />
              <div>
                <p className="font-semibold">{coachName}</p>
                <p className="text-xs text-muted">{coachTitle}</p>
              </div>
            </div>
            <p className="mt-4 text-[17px] leading-relaxed whitespace-pre-line">{message}</p>
            {heart && onHeart && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Did this help today?</span>
                <HeartButton state={heart} onToggle={onHeart} />
              </div>
            )}
          </div>
          {tip && (
            <div className="mt-3 rounded-3xl bg-gold/10 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-gold">
                <Lightbulb className="size-4" /> Tip of the day
              </p>
              {tip.title && <p className="mt-2 font-semibold">{tip.title}</p>}
              <p className="mt-1 leading-relaxed text-ink/90">{tip.body}</p>
            </div>
          )}
          <Button className="mt-5 mb-6 w-full" onClick={close}>
            Let&apos;s go 💪
          </Button>
        </div>
      </div>
    </div>
  );
}
