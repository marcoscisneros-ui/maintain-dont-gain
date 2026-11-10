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
import { playTada } from "@/lib/sound";
import { TrophySheet, trophySpec, type AwardSpec } from "@/components/TrophySheet";
import { loadLeaderboard } from "@/lib/leaderboard";
import { TROPHY_DATA_URL, renderAwardJPG, weekLabel } from "@/lib/trophy";
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
  const [award, setAward] = useState<AwardSpec | null>(null);
  const [finisherStats, setFinisherStats] = useState<{ points: number; workouts: number } | null>(null);
  const [party, setParty] = useState(false);
  const slices = useMemo(() => buildWheel(state?.prizes ?? []), [state?.prizes]);
  const trophies = useMemo(() => {
    if (!state || !profile) return [];
    const earned = state.weeks.filter((w) => w.earned);
    return earned.map((w, i) => ({
      name: `${profile.first_name} ${profile.last_name}`,
      weekStart: w.weekStart,
      trophyNo: i + 1,
      weekNo: state.weeks.findIndex((x) => x.weekStart === w.weekStart) + 1,
      totalWeeks: state.weeks.length,
      days: state.minDays,
    }));
  }, [state, profile]);

  // Opened from the "Get my trophy" button right after earning one
  useEffect(() => {
    if (!trophies.length) return;
    try {
      const wanted = sessionStorage.getItem("mdg-open-trophy");
      if (!wanted) return;
      sessionStorage.removeItem("mdg-open-trophy");
      const t = trophies.find((x) => x.weekStart === wanted);
      if (t) setAward(trophySpec(t));
    } catch {}
  }, [trophies]);

  const finished = !!settings && todayISO() >= settings.end_date;
  useEffect(() => {
    if (!finished || !profile) return;
    loadLeaderboard().then((rows) => {
      const me = rows.find((r) => r.user_id === profile.id);
      setFinisherStats({ points: me?.points ?? 0, workouts: me?.workouts ?? 0 });
    });
  }, [finished, profile]);
  const finisherSpec = (): AwardSpec | null => {
    if (!finisherStats || !profile || !settings) return null;
    const name = `${profile.first_name} ${profile.last_name}`;
    const range = `${formatDate(settings.start_date, { month: "short", day: "numeric" })} – ${formatDate(settings.end_date, { month: "short", day: "numeric", year: "numeric" })}`;
    return {
      title: "🎉 Challenge Finisher",
      alt: `Challenge Finisher certificate for ${name}`,
      fileName: "mdg-challenge-finisher.jpg",
      shareTitle: "I finished Maintain, Don't Gain!",
      shareText: "I made it through the holidays! 🎉 #MaintainDontGain",
      render: () =>
        renderAwardJPG({
          plaque: "FINISHER",
          title: "CHALLENGE FINISHER!",
          name,
          line1: `${finisherStats.workouts} workouts · ${finisherStats.points} points · ${trophies.length} ${trophies.length === 1 ? "trophy" : "trophies"}`,
          line2: `Maintain, Don't Gain · ${range}`,
          line3: "Made it through every holiday 💪",
        }),
    };
  };
  useEffect(() => {
    if (!finisherStats) return;
    try {
      if (sessionStorage.getItem("mdg-open-finisher")) {
        sessionStorage.removeItem("mdg-open-finisher");
        const sp = finisherSpec();
        if (sp) setAward(sp);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finisherStats]);

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
      playTada(true);
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

          {/* Trophies */}
          <section className="rise" style={{ animationDelay: "60ms" }}>
            <SectionTitle>My trophies 🏆</SectionTitle>
            {finished && (
              <button
                onClick={() => {
                  const sp = finisherSpec();
                  if (sp) setAward(sp);
                }}
                disabled={!finisherStats}
                className="mb-2 flex w-full items-center gap-4 rounded-3xl bg-gradient-to-r from-[#1d1a17] to-[#4a2c00] p-4 text-left text-white shadow-card transition active:scale-[0.99]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={TROPHY_DATA_URL} alt="" className="size-16 drop-shadow-lg" />
                <span className="flex-1">
                  <span className="block text-lg font-black">🎉 Challenge Finisher</span>
                  <span className="block text-sm text-white/80">You made it through every holiday. Get your certificate to share!</span>
                </span>
              </button>
            )}
            {trophies.length === 0 ? (
              <Empty>Work out {state.minDays} different days in a week to earn a trophy you can share.</Empty>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {trophies.map((t) => (
                  <button
                    key={t.weekStart}
                    onClick={() => setAward(trophySpec(t))}
                    className="flex flex-col items-center rounded-3xl bg-gradient-to-b from-[#f29445] to-[#c8283f] p-4 text-white shadow-card transition active:scale-[0.97]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={TROPHY_DATA_URL} alt="" className="size-20 drop-shadow-lg" />
                    <span className="mt-1 text-sm font-black">Trophy #{t.trophyNo}</span>
                    <span className="text-xs text-white/85">{weekLabel(t.weekStart)}</span>
                    <span className="mt-2 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold">Download / share</span>
                  </button>
                ))}
              </div>
            )}
          </section>

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
      {award && <TrophySheet spec={award} facebookUrl={settings.facebook_url} onClose={() => setAward(null)} />}
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
