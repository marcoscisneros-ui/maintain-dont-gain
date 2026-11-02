"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lightbulb, MessageCircle, Scale } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import { Ring } from "@/components/Ring";
import { ButtonLink, Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/lib/settings";
import { formatDate, greeting, programStatus, todayISO } from "@/lib/dates";
import { loadDaily, type DailyItem } from "@/lib/daily";

type Today = { calories: number; steps: number; points: number; weightChange: number | null };

export default function HomePage() {
  const { profile } = useAuth();
  const settings = useSettings();
  const [today, setToday] = useState<Today | null>(null);
  const [daily, setDaily] = useState<{ coach: DailyItem | null; tip: DailyItem | null } | null>(null);

  const date = todayISO();
  const status = settings ? programStatus(settings.start_date, settings.end_date, date) : null;

  useEffect(() => {
    if (!profile || !settings) return;
    const sb = supabase();
    const pts = { home: +settings.points_home, gym: +settings.points_gym, class: +settings.points_class };
    const cap = +settings.daily_point_cap || Infinity;
    Promise.all([
      sb.from("meals").select("calories").eq("user_id", profile.id).eq("date", date),
      sb.from("daily_steps").select("steps").eq("user_id", profile.id).eq("date", date).maybeSingle(),
      sb.from("workouts").select("location").eq("user_id", profile.id).eq("date", date),
      sb.from("inbody_scans").select("weight").eq("user_id", profile.id).order("date", { ascending: false }).order("id", { ascending: false }).limit(1),
    ]).then(([meals, steps, workouts, scan]) => {
      const latest = scan.data?.[0]?.weight;
      setToday({
        calories: (meals.data ?? []).reduce((s, m) => s + m.calories, 0),
        steps: steps.data?.steps ?? 0,
        points: Math.min(
          cap,
          (workouts.data ?? []).reduce((s, w) => s + (pts[w.location as keyof typeof pts] ?? 0), 0),
        ),
        weightChange: latest != null && profile.start_weight != null ? Number(latest) - Number(profile.start_weight) : null,
      });
    });
  }, [profile, settings, date]);

  useEffect(() => {
    if (status) loadDaily(status.day).then(setDaily);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.day]);

  if (!profile || !settings || !status) return null;
  const coachName = settings.coach_name || "Marcos";

  return (
    <div className="space-y-4 pt-6">
      {/* Header */}
      <header className="rise flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{formatDate(date, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">
            {greeting()}, {profile.first_name}
          </h1>
        </div>
        <Link href="/me" aria-label="My profile">
          <Avatar url={profile.avatar_url} name={`${profile.first_name} ${profile.last_name}`} size={48} />
        </Link>
      </header>

      {/* Program progress */}
      <section
        className="rise relative overflow-hidden rounded-3xl brand-gradient p-5 text-white shadow-[0_16px_40px_-20px_var(--brand)]"
        style={{ animationDelay: "40ms" }}
      >
        <div aria-hidden className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -right-4 -bottom-16 size-32 rounded-full bg-white/10" />
        <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-85">Maintain, Don&apos;t Gain</p>
        {status.phase === "before" && (
          <>
            <p className="mt-2 text-3xl font-bold">
              Starts in {status.daysUntilStart} day{status.daysUntilStart === 1 ? "" : "s"}
            </p>
            <p className="mt-1 opacity-90">
              Kickoff is {formatDate(settings.start_date, { weekday: "long", month: "long", day: "numeric" })}. Get ready!
            </p>
          </>
        )}
        {status.phase === "during" && (
          <>
            <p className="mt-2 text-3xl font-bold">
              Day {status.day} <span className="text-xl font-semibold opacity-80">of {status.totalDays}</span>
            </p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${(status.day / status.totalDays) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-sm opacity-90">
              {status.totalDays - status.day === 0
                ? "Final day. Finish strong!"
                : `${status.totalDays - status.day} days to go. Hold the line.`}
            </p>
          </>
        )}
        {status.phase === "after" && (
          <>
            <p className="mt-2 text-3xl font-bold">You did it! 🎉</p>
            <p className="mt-1 opacity-90">The challenge wrapped on {formatDate(settings.end_date, { month: "long", day: "numeric" })}.</p>
          </>
        )}
      </section>

      {/* Message from Marcos */}
      <Card className="rise" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center gap-3">
          <Avatar url={settings.coach_photo_url || null} name={coachName} size={44} />
          <div>
            <p className="font-semibold">{coachName}</p>
            <p className="text-xs text-muted">{settings.coach_title || "Your coach"} · today&apos;s message</p>
          </div>
        </div>
        <p className="mt-4 text-[17px] leading-relaxed whitespace-pre-line">
          {daily?.coach?.body ??
            `Welcome to Maintain, Don't Gain! The holidays don't have to mean starting over in January. Log a little every day, show up when you can, and let's walk into the new year exactly where we started, or better. I'm in this with you. – ${coachName}`}
        </p>
      </Card>

      {/* Tip of the day */}
      <Card className="rise" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center gap-2 text-sm font-semibold text-gold">
          <Lightbulb className="size-4" /> Tip of the day
        </div>
        {daily?.tip?.title && <p className="mt-2 text-lg font-semibold">{daily.tip.title}</p>}
        <p className="mt-1.5 leading-relaxed text-ink/90 whitespace-pre-line">
          {daily?.tip?.body ?? "Fill half your plate with veggies first. Then enjoy the rest without guilt."}
        </p>
      </Card>

      {/* Today at a glance */}
      <Card className="rise" style={{ animationDelay: "160ms" }}>
        <h2 className="mb-4 font-semibold">Today at a glance</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Glance label="Calories" sub={`of ${profile.calorie_target.toLocaleString()}`}>
            <Ring value={today?.calories ?? 0} max={profile.calorie_target} color="var(--brand)">
              <span className="text-lg font-bold">{(today?.calories ?? 0).toLocaleString()}</span>
            </Ring>
          </Glance>
          <Glance label="Steps" sub={`of ${profile.step_goal.toLocaleString()}`}>
            <Ring value={today?.steps ?? 0} max={profile.step_goal} color="var(--accent)">
              <span className="text-lg font-bold">{formatK(today?.steps ?? 0)}</span>
            </Ring>
          </Glance>
          <Glance label="Points" sub="today">
            <Ring value={today?.points ?? 0} max={+settings.daily_point_cap || 5} color="var(--gold)">
              <span className="text-lg font-bold">{today?.points ?? 0}</span>
            </Ring>
          </Glance>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-card-2 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-muted">
            <Scale className="size-4" /> Weight since start
          </span>
          <WeightChange value={today?.weightChange ?? null} />
        </div>
      </Card>

      {settings.groupme_url && (
        <ButtonLink href={settings.groupme_url} external variant="secondary" className="rise w-full">
          <MessageCircle className="size-5 text-brand" /> Open our GroupMe
        </ButtonLink>
      )}
    </div>
  );
}

function Glance({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      {children}
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  );
}

function WeightChange({ value }: { value: number | null }) {
  if (value == null) return <span className="text-sm text-muted">No weigh-ins yet</span>;
  const v = Math.round(value * 10) / 10;
  const good = v <= 1; // within a pound counts as maintaining
  return (
    <span className={`font-bold ${good ? "text-accent" : "text-brand"}`}>
      {v > 0 ? "+" : ""}
      {v.toFixed(1)} lbs {good ? "✓" : ""}
    </span>
  );
}

function formatK(n: number) {
  return n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
