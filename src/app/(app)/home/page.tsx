"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, BookOpen, ChevronRight, Footprints, Lightbulb, Megaphone, MessageCircle, Scale, Trophy, Utensils } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import { Ring } from "@/components/Ring";
import { ButtonLink, Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/lib/settings";
import { formatDate, greeting, programStatus, todayISO } from "@/lib/dates";
import { loadDaily, welcomeFallback, type DailyItem } from "@/lib/daily";
import { DailyWelcome } from "@/components/DailyWelcome";
import { CommunityCard } from "@/components/CommunityCard";
import { HeartButton } from "@/components/HeartButton";
import { markSeenAndLoad, setHeart, type HeartState } from "@/lib/engagement";
import { JingleBells, SeasonalFall } from "@/components/Seasonal";
import { formatEventTime, lastSeenNews, loadAnnouncements, splitFeed, type Announcement } from "@/lib/content";
import { pointsForDay } from "@/lib/points";
import { useRewards } from "@/lib/useRewards";
import { loadLeaderboard, ranks } from "@/lib/leaderboard";

type Today = { calories: number; steps: number; points: number; weightChange: number | null };
type Rank = { rank: number; of: number; points: number } | null;

export default function HomePage() {
  const { profile } = useAuth();
  const settings = useSettings();
  const [today, setToday] = useState<Today | null>(null);
  const [rank, setRank] = useState<Rank>(null);
  const [feed, setFeed] = useState<{ latest: Announcement | null; nextEvent: Announcement | null; unseen: boolean } | null>(null);
  const [daily, setDaily] = useState<{ coach: DailyItem | null; tip: DailyItem | null } | null>(null);
  const [heart, setHeartState] = useState<HeartState | null>(null);
  const { state: rewards } = useRewards(profile, settings);

  const date = todayISO();
  const status = settings ? programStatus(settings.start_date, settings.end_date, date) : null;

  useEffect(() => {
    if (!profile || !settings) return;
    const sb = supabase();
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
        points: pointsForDay((workouts.data ?? []).map((w) => w.location), date, settings),
        weightChange: latest != null && profile.start_weight != null ? Number(latest) - Number(profile.start_weight) : null,
      });
    });
    loadLeaderboard().then((rows) => {
      const i = rows.findIndex((r) => r.user_id === profile.id);
      setRank(i >= 0 ? { rank: ranks(rows)[i], of: rows.length, points: rows[i].points } : null);
    });
  }, [profile, settings, date]);

  useEffect(() => {
    if (status) loadDaily(status).then(setDaily);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.day, status?.phase]);

  // Record "seen" for today's message and load its hearts.
  const coachId = daily?.coach?.id;
  useEffect(() => {
    if (!profile || !coachId) return;
    markSeenAndLoad(profile.id, coachId).then(setHeartState).catch(() => {});
  }, [profile, coachId]);

  async function toggleHeart() {
    if (!profile || !coachId || !heart) return;
    const next = { hearted: !heart.hearted, count: Math.max(0, heart.count + (heart.hearted ? -1 : 1)) };
    setHeartState(next);
    try {
      await setHeart(profile.id, coachId, next.hearted);
      setHeartState(await markSeenAndLoad(profile.id, coachId)); // fresh count incl. everyone else's hearts
    } catch {
      setHeartState(heart); // undo on failure
    }
  }

  useEffect(() => {
    loadAnnouncements().then((all) => {
      const { events, news } = splitFeed(all);
      const maxId = all.length ? Math.max(...all.map((a) => a.id)) : 0;
      setFeed({ latest: news[0] ?? null, nextEvent: events[0] ?? null, unseen: maxId > lastSeenNews() });
    });
  }, []);

  if (!profile || !settings || !status) return null;
  const coachName = settings.coach_name || "Marcos";
  const coachMessage = daily?.coach?.body ?? welcomeFallback(coachName);

  return (
    <div className="space-y-4 pt-6">
      {daily && (
        <DailyWelcome
          userId={profile.id}
          date={date}
          status={status}
          coachName={coachName}
          coachTitle={settings.coach_title || "Your coach"}
          coachPhoto={settings.coach_photo_url || null}
          firstName={profile.first_name}
          message={coachMessage}
          tip={daily.tip}
          heart={heart}
          onHeart={toggleHeart}
        />
      )}
      {/* Header */}
      <header className="rise flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{formatDate(date, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">
            {greeting()}, {profile.first_name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
        {profile.is_admin && (
          <Link href="/admin" className="rounded-full bg-violet/12 px-3 py-1.5 text-xs font-bold text-violet ring-1 ring-violet/25">
            Admin
          </Link>
        )}
        <Link href="/me" aria-label="My profile">
          <Avatar url={profile.avatar_url} name={`${profile.first_name} ${profile.last_name}`} size={48} />
        </Link>
        </div>
      </header>

      {/* Program progress */}
      <section
        className="rise relative overflow-hidden rounded-3xl brand-gradient p-5 text-white shadow-[0_16px_40px_-20px_var(--brand)]"
        style={{ animationDelay: "40ms" }}
      >
        <div aria-hidden className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -right-4 -bottom-16 size-32 rounded-full bg-white/10" />
        <SeasonalFall count={12} />
        <JingleBells size={58} className="absolute top-3 right-3 drop-shadow-md" />
        <p className="relative pr-16 text-xs font-semibold tracking-[0.18em] uppercase opacity-85">Maintain, Don&apos;t Gain</p>
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

      {!profile.phone && (
        <Link href="/me" className="rise flex items-center gap-3 rounded-2xl bg-gold/12 px-4 py-3 text-sm ring-1 ring-gold/30">
          <span className="text-xl">📱</span>
          <span className="flex-1">
            <b>Add your phone number</b> so staff can reach you about prizes and events.
          </span>
          <ChevronRight className="size-4 text-muted" />
        </Link>
      )}

      {/* Quick log */}
      <section className="rise grid grid-cols-4 gap-2" style={{ animationDelay: "60ms" }}>
        <Quick href="/food" label="Food" Icon={Utensils} color="var(--brand)" />
        <Quick href="/move" label="Workout" Icon={Activity} color="var(--violet)" />
        <Quick href="/move" label="Steps" Icon={Footprints} color="var(--accent)" />
        <Quick href="/progress" label="Weigh-in" Icon={Scale} color="var(--gold)" />
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
          {coachMessage}
        </p>
        {heart && (
          <div className="mt-4 flex justify-end">
            <HeartButton state={heart} onToggle={toggleHeart} />
          </div>
        )}
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

      {/* News & events */}
      {feed && (feed.nextEvent || feed.latest) && (
        <Link href="/news" className="rise block">
          <Card className="active:scale-[0.99] transition">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-violet">
                <Megaphone className="size-4" /> News & events
              </span>
              {feed.unseen && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">NEW</span>}
            </div>
            {feed.nextEvent && feed.nextEvent.event_at && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl brand-gradient text-white">
                  <span className="text-[10px] font-bold">{formatEventTime(feed.nextEvent.event_at).month}</span>
                  <span className="text-lg leading-none font-bold">{formatEventTime(feed.nextEvent.event_at).day}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{feed.nextEvent.title}</p>
                  <p className="truncate text-sm text-muted">{formatEventTime(feed.nextEvent.event_at).full}</p>
                </div>
              </div>
            )}
            {feed.latest && (
              <div className={feed.nextEvent ? "mt-3 border-t border-line pt-3" : "mt-2"}>
                <p className="font-semibold">{feed.latest.title}</p>
                <p className="line-clamp-2 text-sm text-muted">{feed.latest.body.replace(/[#*-]/g, "").trim()}</p>
              </div>
            )}
          </Card>
        </Link>
      )}

      {rewards && (
        <Link href="/rewards" className="rise block">
          <Card className="flex items-center gap-4 active:scale-[0.99] transition">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/12 text-2xl">🎡</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {rewards.available.length > 0 ? "You've got a spin waiting!" : "Weekly prize wheel"}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {Array.from({ length: rewards.minDays }, (_, i) => (
                  <span key={i} className={`h-2 flex-1 rounded-full ${i < rewards.thisWeek.days.length ? "brand-gradient" : "bg-card-2"}`} />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">
                {Math.min(rewards.thisWeek.days.length, rewards.minDays)} of {rewards.minDays} workout days this week
                {rewards.spins.some((s) => !s.redeemed_at) ? " · 🎁 prize to claim" : ""}
              </p>
            </div>
            {rewards.available.length > 0 ? (
              <span className="rounded-full brand-gradient px-3 py-1.5 text-xs font-bold text-white">SPIN</span>
            ) : (
              <ChevronRight className="size-5 text-muted" />
            )}
          </Card>
        </Link>
      )}

      {rank && (
        <Link href="/crew" className="rise block">
          <Card className="flex items-center gap-4 active:scale-[0.99] transition">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gold/15 text-gold">
              <Trophy className="size-6" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">
                {rank.points > 0 ? `You're #${rank.rank} of ${rank.of}` : "Get on the board"}
              </p>
              <p className="text-sm text-muted">
                {rank.points} challenge point{rank.points === 1 ? "" : "s"} · see the leaderboard
              </p>
            </div>
            <ChevronRight className="size-5 text-muted" />
          </Card>
        </Link>
      )}

      <Link href="/library" className="rise block">
        <Card className="flex items-center gap-4 active:scale-[0.99] transition">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <BookOpen className="size-6" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">Recipes & Tips</p>
            <p className="text-sm text-muted">Easy meals and holiday survival tricks</p>
          </div>
          <ChevronRight className="size-5 text-muted" />
        </Card>
      </Link>

      <CommunityCard url={settings.facebook_url} compact />

      {settings.groupme_url && (
        <ButtonLink href={settings.groupme_url} external variant="secondary" className="rise w-full">
          <MessageCircle className="size-5 text-brand" /> Open our GroupMe
        </ButtonLink>
      )}
    </div>
  );
}

function Quick({
  href,
  label,
  Icon,
  color,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl bg-card py-3.5 shadow-card ring-1 ring-line/60 transition active:scale-[0.96]"
    >
      <span className="flex size-10 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
        <Icon className="size-5" style={{ color }} />
      </span>
      <span className="text-xs font-semibold">{label}</span>
    </Link>
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
