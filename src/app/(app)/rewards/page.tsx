"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Lock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Certificate } from "@/components/Certificate";
import { Confetti, PrizeWheel, rotationFor } from "@/components/PrizeWheel";
import { Sheet } from "@/components/Sheet";
import { Button, Card, Empty, ErrorText, PageHeader, SectionTitle, cn } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/lib/settings";
import { useRewards } from "@/lib/useRewards";
import { addDays, formatDate, todayISO } from "@/lib/dates";
import { buildWheel, type Spin } from "@/lib/rewards";
import { useMemo } from "react";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export default function RewardsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const settings = useSettings();
  const { state, reload } = useRewards(profile, settings);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<Spin | null>(null);
  const [viewing, setViewing] = useState<Spin | null>(null);
  const [error, setError] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [party, setParty] = useState(false);
  const slices = useMemo(() => buildWheel(state?.prizes ?? []), [state?.prizes]);
  const emojiFor = (sp: Spin) => state?.prizes.find((p) => p.id === sp.prize_id)?.emoji ?? "🎁";

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (!profile || !settings) return null;
  const name = `${profile.first_name} ${profile.last_name}`;
  const today = todayISO();
  const before = today < settings.start_date;

  async function spin() {
    if (!state || spinning) return;
    setError("");
    setSpinning(true);
    const { data } = await supabase().auth.getSession();
    const res = await fetch("/api/spin", { method: "POST", headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSpinning(false);
      setError(json.error ?? "Something went wrong. Try again.");
      return;
    }
    setWinner(null);
    const target = rotationFor(slices, json.prize.id, rotation);
    setRotation(target.rotation);
    setTimeout(() => {
      setSpinning(false);
      setWinner(target.index);
      setParty(true);
      setTimeout(() => setWon(json.spin as Spin), reduceMotion ? 0 : 900);
      setTimeout(() => setParty(false), 2600);
      reload();
    }, reduceMotion ? 300 : 5400);
  }

  return (
    <div className="space-y-4 pt-6">
      <button onClick={() => router.back()} className="-ml-2 flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft className="size-5" /> Back
      </button>
      <PageHeader title="Weekly prize wheel" subtitle={`Work out ${state?.minDays ?? 4} different days in a week to earn a spin.`} />

      {!state ? (
        <div className="h-80 animate-pulse rounded-3xl bg-card" />
      ) : (
        <>
          {/* This week's progress */}
          <Card className="rise">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{before ? "First week starts " + formatDate(settings.start_date) : "This week"}</h2>
              <span className={cn("text-sm font-bold", state.thisWeek.days.length >= state.minDays ? "text-accent" : "text-muted")}>
                {Math.min(state.thisWeek.days.length, 7)} of {state.minDays} days
              </span>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {DAY_LETTERS.map((l, i) => {
                const d = addDays(state.thisWeek.start, i);
                const done = state.thisWeek.days.includes(d);
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full text-sm font-bold",
                        done ? "brand-gradient text-white" : d === today ? "bg-card-2 ring-2 ring-brand/40" : "bg-card-2 text-muted",
                      )}
                    >
                      {done ? "✓" : l}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-muted">
              {state.thisWeek.days.length >= state.minDays
                ? "You earned this week's spin! 🎉"
                : before
                  ? "Log workouts on the Move tab starting kickoff week."
                  : `${state.minDays - state.thisWeek.days.length} more workout day${state.minDays - state.thisWeek.days.length === 1 ? "" : "s"} to earn this week's spin.`}
            </p>
          </Card>

          {/* Wheel */}
          <Card className="rise overflow-hidden" style={{ animationDelay: "40ms" }}>
            <div className="py-2">
              <PrizeWheel
                slices={slices}
                rotation={rotation}
                spinning={spinning && !reduceMotion}
                canSpin={state.available.length > 0}
                onSpin={spin}
                winner={winner}
              />
            </div>
            <ErrorText>{error}</ErrorText>
            {state.available.length > 0 ? (
              <Button className="mt-3 w-full text-lg" onClick={spin} loading={spinning}>
                🎡 Spin! {state.available.length > 1 ? `(${state.available.length} spins)` : ""}
              </Button>
            ) : (
              <Button className="mt-3 w-full" variant="secondary" disabled>
                <Lock className="size-4" /> No spins available yet
              </Button>
            )}
            <p className="mt-3 text-center text-xs text-muted">
              Prizes and chances are set by the gym. Each earned week = one spin. One certificate per spin.
            </p>
          </Card>

          {/* Certificates */}
          <section className="rise" style={{ animationDelay: "80ms" }}>
            <SectionTitle>My certificates</SectionTitle>
            {state.spins.length === 0 ? (
              <Empty>Your prize certificates will show up here.</Empty>
            ) : (
              <div className="space-y-2">
                {state.spins.map((s) => (
                  <button key={s.id} onClick={() => setViewing(s)} className="block w-full text-left">
                    <Card className="flex items-center gap-3 p-4 transition active:scale-[0.99]">
                      <span className="text-2xl">{emojiFor(s)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{s.prize_name}</p>
                        <p className="text-xs text-muted">
                          Week of {formatDate(s.week_start)} · <span className="font-mono">{s.code}</span>
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-bold",
                          s.redeemed_at ? "bg-accent/12 text-accent" : "bg-gold/15 text-gold",
                        )}
                      >
                        {s.redeemed_at ? "Redeemed" : "Ready to claim"}
                      </span>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {party && <Confetti />}
      {won && (
        <Sheet title="🎉 Winner!" onClose={() => setWon(null)}>
          <div className="prize-pop mb-4 text-center">
            <p className="bg-gradient-to-r from-[#ff3d5a] via-[#ff9f1a] to-[#ffd23f] bg-clip-text text-4xl font-black tracking-tight text-transparent">YOU WON!</p>
            <p className="mt-1 text-6xl">{emojiFor(won)}</p>
          </div>
          <Certificate spin={won} name={name} emoji={emojiFor(won)} />
          <p className="mt-4 text-center text-sm text-muted">Saved in My certificates. Show it at the front desk anytime.</p>
          <Button className="mt-4 w-full" onClick={() => setWon(null)}>
            Awesome!
          </Button>
        </Sheet>
      )}
      {viewing && (
        <Sheet title="Certificate" onClose={() => setViewing(null)}>
          <Certificate spin={viewing} name={name} emoji={emojiFor(viewing)} />
        </Sheet>
      )}
    </div>
  );
}
