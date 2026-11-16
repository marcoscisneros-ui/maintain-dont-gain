"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ChevronLeft, Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import { Collectible, type CollectibleKind } from "@/components/Collectibles";
import { Confetti } from "@/components/PrizeWheel";
import { JingleBells, seasonFor } from "@/components/Seasonal";
import { Coin3D, Crown, LiveFlakes, PodiumBlock, StringLights, Turkey, type TurkeyPose } from "@/components/live/LiveArt";
import { loadLeaderboard, ranks, type Row } from "@/lib/leaderboard";
import { loadSettings, type Settings } from "@/lib/settings";
import { formatDate, programStatus, todayISO, type ProgramStatus } from "@/lib/dates";
import { multiplierFor, pointValues, type Location } from "@/lib/points";
import { weekStart } from "@/lib/rewards";
import { loadDaily } from "@/lib/daily";
import { playTada, unlockAudio } from "@/lib/sound";
import { supabase } from "@/lib/supabase";

const REFRESH_MS = 20_000;
const SLIDE_MS = 13_000;
const CELEBRATE_MS = 6_500;

type Workout = { id: number; user_id: string; date: string; location: Location; activity: string; created_at: string };
type Person = { id: string; first_name: string; last_name: string; avatar_url: string | null };
type Spin = { id: number; user_id: string; prize_name: string; created_at: string };
type Moment = { id: number; name: string; avatar: string | null; kind: CollectibleKind; line: string; points: number };

const KIND: Record<Location, CollectibleKind> = { home: "medal", gym: "dumbbell", class: "star", pt: "trophy" };
const EMOJI: Record<Location, string> = { home: "🏠", gym: "🏋️", class: "🔥", pt: "🤝" };

function describe(w: Workout): string {
  if (w.location === "class") return `took a ${w.activity}${/class/i.test(w.activity) ? "" : " class"}`;
  if (w.location === "pt") return "crushed a personal training session";
  if (w.location === "gym") return `got a ${w.activity.toLowerCase()} workout in at the gym`;
  return `worked out at home (${w.activity.toLowerCase()})`;
}

function ago(iso: string, now: number): string {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

/** Everything is designed at 1920 wide; pictures scale with the screen like the text does. */
function useScale() {
  const [k, setK] = useState(1);
  useEffect(() => {
    const on = () => setK(window.innerWidth / 1920);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return useCallback((n: number) => Math.round(n * k), [k]);
}

/** Big-screen, auto-updating board for the front desk TV. */
export default function LiveDashboard() {
  const px = useScale();
  const router = useRouter();
  const { profile } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [people, setPeople] = useState<Map<string, Person>>(new Map());
  const [week, setWeek] = useState<Workout[]>([]);
  const [feed, setFeed] = useState<Workout[]>([]);
  const [spins, setSpins] = useState<Spin[]>([]);
  const [coachMsg, setCoachMsg] = useState<string>("");
  const [tip, setTip] = useState<{ title: string | null; body: string } | null>(null);
  const [deltas, setDeltas] = useState<Record<string, { n: number; key: number }>>({});
  const [queue, setQueue] = useState<Moment[]>([]);
  const [moment, setMoment] = useState<Moment | null>(null);
  const [qr, setQr] = useState("");
  const [sound, setSound] = useState(false);
  const [full, setFull] = useState(false);
  const [chrome, setChrome] = useState(true);
  const lastId = useRef<number | null>(null);
  const lastPoints = useRef<Map<string, number> | null>(null);

  useEffect(() => {
    if (profile && !profile.is_admin) router.replace("/home");
  }, [profile, router]);

  // scale everything to the screen: 1rem ≈ 1% of the width on a TV
  useEffect(() => {
    const html = document.documentElement;
    const before = html.style.fontSize;
    html.style.fontSize = "0.95vw";
    return () => {
      html.style.fontSize = before;
    };
  }, []);

  const refresh = useCallback(async () => {
    const s = await loadSettings(true);
    setSettings(s);
    const today = todayISO();
    const db = supabase();
    const [lb, ppl, wk, recent, sp] = await Promise.all([
      loadLeaderboard(),
      db.from("profiles").select("id, first_name, last_name, avatar_url"),
      db.from("workouts").select("id, user_id, date, location, activity, created_at").gte("date", weekStart(today)).lte("date", today),
      db.from("workouts").select("id, user_id, date, location, activity, created_at").gte("date", s.start_date).order("id", { ascending: false }).limit(24),
      db.from("spins").select("id, user_id, prize_name, created_at").order("created_at", { ascending: false }).limit(8),
    ]);
    const map = new Map(((ppl.data ?? []) as Person[]).map((p) => [p.id, p]));
    const recentRows = (recent.data ?? []) as Workout[];
    setRows(lb.filter((r) => map.has(r.user_id) || !ppl.data));
    setPeople(map);
    setWeek((wk.data ?? []) as Workout[]);
    setFeed(recentRows);
    setSpins(sp.error ? [] : ((sp.data ?? []) as Spin[]));

    // points that went up since last refresh → little "+3" bubble on the board
    const pts = new Map(lb.map((r) => [r.user_id, r.points]));
    if (lastPoints.current) {
      const up: Record<string, { n: number; key: number }> = {};
      for (const [id, p] of pts) {
        const was = lastPoints.current.get(id) ?? 0;
        if (p > was) up[id] = { n: p - was, key: Date.now() };
      }
      if (Object.keys(up).length) setDeltas((d) => ({ ...d, ...up }));
    }
    lastPoints.current = pts;

    // brand-new workouts → the big celebration moment (first load just sets the baseline)
    const newest = recentRows[0]?.id ?? 0;
    if (lastId.current != null && newest > lastId.current) {
      const vals = pointValues(s);
      const fresh = recentRows
        .filter((w) => w.id > lastId.current!)
        .reverse()
        .slice(-5)
        .map((w): Moment => {
          const p = map.get(w.user_id);
          const name = p ? `${p.first_name} ${p.last_name.slice(0, 1)}.` : "Someone";
          return { id: w.id, name, avatar: p?.avatar_url ?? null, kind: KIND[w.location], line: describe(w), points: vals[w.location] * multiplierFor(w.date, s) };
        });
      setQueue((q) => [...q, ...fresh].slice(-6));
    }
    if (lastId.current == null || newest > lastId.current) lastId.current = newest;
  }, []);

  useEffect(() => {
    if (!profile?.is_admin) return;
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [profile, refresh]);

  // today's coach message + tip (changes at midnight)
  const status: ProgramStatus | null = settings ? programStatus(settings.start_date, settings.end_date) : null;
  const statusKey = status ? `${status.phase}-${status.day}` : "";
  useEffect(() => {
    if (!status) return;
    loadDaily(status).then(({ coach, tip }) => {
      setCoachMsg(coach?.body ?? "");
      setTip(tip ? { title: tip.title, body: tip.body } : null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusKey]);

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/join`, { width: 360, margin: 1, color: { dark: "#1d1a17", light: "#ffffff" } })
      .then(setQr)
      .catch(() => {});
  }, []);

  // play celebrations one at a time
  useEffect(() => {
    if (moment || !queue.length) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setMoment(next);
    if (sound) playTada(next.points >= 3);
  }, [queue, moment, sound]);
  useEffect(() => {
    if (!moment) return;
    const t = setTimeout(() => setMoment(null), CELEBRATE_MS);
    return () => clearTimeout(t);
  }, [moment]);

  // keep the TV awake
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const ask = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lock = await (navigator as any).wakeLock?.request("screen");
      } catch {}
    };
    ask();
    const onVis = () => document.visibilityState === "visible" && ask();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);

  // controls fade away when the mouse/remote is idle
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setChrome(true);
      clearTimeout(t);
      t = setTimeout(() => setChrome(false), 4000);
    };
    wake();
    const onFs = () => setFull(!!document.fullscreenElement);
    window.addEventListener("pointermove", wake);
    window.addEventListener("keydown", wake);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("keydown", wake);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  const today = todayISO();
  const winter = seasonFor(today) === "winter";
  const bonus = settings ? multiplierFor(today, settings) : 1;
  const rk = useMemo(() => ranks(rows), [rows]);
  const live = rows.filter((r) => r.points > 0);

  const stats = useMemo(() => {
    const todayW = week.filter((w) => w.date === today);
    return {
      weekWorkouts: week.length,
      todayActive: new Set(todayW.map((w) => w.user_id)).size,
      weekClasses: week.filter((w) => w.location === "class").length,
      totalPoints: rows.reduce((a, r) => a + r.points, 0),
    };
  }, [week, rows, today]);

  const hustle = useMemo(() => {
    const days = new Map<string, Set<string>>();
    for (const w of week) {
      if (!days.has(w.user_id)) days.set(w.user_id, new Set());
      days.get(w.user_id)!.add(w.date);
    }
    return [...days.entries()]
      .map(([id, d]) => ({ id, days: d.size, p: people.get(id) }))
      .filter((x) => x.p)
      .sort((a, b) => b.days - a.days)
      .slice(0, 6);
  }, [week, people]);

  if (!profile?.is_admin || !settings || !status) {
    return (
      <div className="lv-root fixed inset-0 flex items-center justify-center">
        <Turkey size={px(200)} pose="walk" />
      </div>
    );
  }

  const name = (id: string) => {
    const p = people.get(id);
    return p ? `${p.first_name} ${p.last_name.slice(0, 1)}.` : "Member";
  };

  const slides = [
    { id: "stats", el: <StatsSlide stats={stats} /> },
    { id: "hustle", el: <HustleSlide hustle={hustle} minDays={Number(settings.spin_min_days) || 5} />, mascot: "flex" as TurkeyPose },
    { id: "wheel", el: <WheelSlide spins={spins} name={name} minDays={Number(settings.spin_min_days) || 5} /> },
    ...(coachMsg ? [{ id: "coach", el: <CoachSlide text={coachMsg} coach={settings.coach_name} photo={settings.coach_photo_url} />, mascot: "cheer" as TurkeyPose }] : []),
    ...(tip ? [{ id: "tip", el: <TipSlide title={tip.title} body={tip.body} />, mascot: "idle" as TurkeyPose }] : []),
    ...(qr ? [{ id: "join", el: <JoinSlide qr={qr} code={settings.join_code} /> }] : []),
  ];

  const headline =
    status.phase === "before"
      ? `Kickoff in ${status.daysUntilStart} day${status.daysUntilStart === 1 ? "" : "s"}`
      : status.phase === "after"
        ? "That's a wrap!"
        : `Day ${status.day} of ${status.totalDays}`;

  return (
    <div className={`lv-root fixed inset-0 overflow-hidden ${chrome ? "" : "cursor-none"}`}>
      {/* ambience */}
      <div aria-hidden className="lv-aurora left-[-10%] top-[10%] h-[40vh] w-[45vw] bg-[#c8283f]/30" />
      <div aria-hidden className="lv-aurora right-[-10%] top-[30%] h-[45vh] w-[40vw] bg-[#1f8a5b]/25" style={{ animationDelay: "-6s" }} />
      <LiveFlakes winter={winter} />
      <StringLights />

      <div className="relative z-10 grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-[1.2rem] px-[2.2rem] pt-[3.4rem] pb-0">
        {/* ---- header */}
        <header className="flex items-center gap-[1.4rem]">
          <JingleBells size={px(70)} />
          <div className="min-w-0">
            <p className="text-[0.95rem] font-bold tracking-[0.35em] text-[#ffd23f] uppercase">Holiday challenge</p>
            <h1 className="bg-gradient-to-r from-white via-[#ffe7c2] to-[#ffb37a] bg-clip-text text-[3.1rem] leading-none font-black tracking-tight text-transparent">Maintain, Don&apos;t Gain</h1>
          </div>
          <span className="ml-[0.6rem] flex items-center gap-[0.5rem] rounded-full bg-[#ff3d5a] px-[1rem] py-[0.35rem] text-[1rem] font-black tracking-widest text-white uppercase">
            <span className="lv-live-dot size-[0.65rem] rounded-full bg-white" /> Live
          </span>
          {bonus > 1 && (
            <span className="celebrate-pop rounded-full bg-gradient-to-r from-[#ffd23f] to-[#ff9f1a] px-[1.1rem] py-[0.4rem] text-[1.1rem] font-black text-[#4a2c00] shadow-lg">
              ⚡ {bonus}X POINTS TODAY
            </span>
          )}
          <div className="ml-auto text-right">
            <Clock />
            <p className="text-[1.15rem] font-semibold text-white/75">
              {headline} · {formatDate(settings.start_date)} – {formatDate(settings.end_date)}
            </p>
          </div>
        </header>

        {/* ---- main */}
        <main className="grid min-h-0 grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.95fr)] gap-[1.4rem]">
          <Podium rows={live.slice(0, 3)} deltas={deltas} />
          <Board rows={rows} ranks={rk} deltas={deltas} />
          <Spotlight slides={slides} />
        </main>

        {/* ---- turkey parade + ticker */}
        <footer className="relative -mx-[2.2rem]">
          <div className="relative h-[7.5rem]">
            <div className="lv-parade" style={{ "--walk": "38s", "--wd": "0s" } as CSSProperties}>
              <Turkey size={px(120)} pose="walk" />
            </div>
            <div className="lv-parade" style={{ "--walk": "38s", "--wd": "-19s" } as CSSProperties}>
              <Turkey size={px(110)} pose="walk" delay={0.2} />
            </div>
            <div className="lv-parade lv-rtl" style={{ "--walk": "52s", "--wd": "-8s" } as CSSProperties}>
              <Turkey size={px(100)} pose="walk" delay={0.4} />
            </div>
          </div>
          <Ticker feed={feed} name={name} />
        </footer>
      </div>

      {/* floating 3D collectibles */}
      <Floaters />

      {/* someone just logged a workout */}
      {moment && <MomentOverlay key={moment.id} m={moment} />}

      {/* controls (fade out when idle) */}
      <div className={`absolute top-[3.6rem] right-[1rem] z-30 flex gap-[0.5rem] transition-opacity duration-500 ${chrome ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <Link href="/admin" className="flex items-center gap-1 rounded-full bg-black/50 px-[0.9rem] py-[0.5rem] text-[0.9rem] font-semibold text-white ring-1 ring-white/20">
          <ChevronLeft className="size-[1.1rem]" /> Admin
        </Link>
        <button
          onClick={() => {
            unlockAudio();
            setSound((v) => {
              if (!v) playTada();
              return !v;
            });
          }}
          className="flex items-center gap-1 rounded-full bg-black/50 px-[0.9rem] py-[0.5rem] text-[0.9rem] font-semibold text-white ring-1 ring-white/20"
        >
          {sound ? <Volume2 className="size-[1.1rem]" /> : <VolumeX className="size-[1.1rem]" />} {sound ? "Sound on" : "Sound off"}
        </button>
        <button
          onClick={() => {
            unlockAudio();
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            else document.documentElement.requestFullscreen?.().catch(() => {});
          }}
          className="flex items-center gap-1 rounded-full bg-[#ffd23f] px-[0.9rem] py-[0.5rem] text-[0.9rem] font-bold text-[#4a2c00]"
        >
          {full ? <Minimize className="size-[1.1rem]" /> : <Maximize className="size-[1.1rem]" />} {full ? "Exit full screen" : "Full screen"}
        </button>
      </div>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <p className="text-[2.6rem] leading-none font-black">&nbsp;</p>;
  const time = now.toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" });
  const day = now.toLocaleDateString("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric" });
  return (
    <p className="leading-none">
      <span className="text-[2.6rem] font-black tabular-nums">{time}</span>
      <span className="ml-[0.8rem] text-[1.3rem] font-semibold text-white/80">{day}</span>
    </p>
  );
}

function useCountUp(target: number, ms = 1400) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(a + (target - a) * e));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Delta({ d }: { d?: { n: number; key: number } }) {
  if (!d) return null; // the bubble fades itself out (animation ends invisible)
  return (
    <span key={d.key} className="lv-delta absolute -top-[0.9rem] -right-[0.6rem] rounded-full bg-[#ffd23f] px-[0.6rem] py-[0.1rem] text-[1rem] font-black text-[#4a2c00] shadow-lg">
      +{d.n}
    </span>
  );
}

function Podium({ rows, deltas }: { rows: Row[]; deltas: Record<string, { n: number; key: number }> }) {
  const px = useScale();
  // display order: 2nd, 1st, 3rd
  const slots: { place: 1 | 2 | 3; h: string; r?: Row }[] = [
    { place: 2, h: "52%", r: rows[1] },
    { place: 1, h: "66%", r: rows[0] },
    { place: 3, h: "40%", r: rows[2] },
  ];
  return (
    <section className="lv-glass relative flex min-h-0 flex-col overflow-hidden rounded-[1.6rem] px-[1.4rem] pt-[1.1rem]">
      <div aria-hidden className="lv-beam pointer-events-none absolute top-0 left-1/2 h-[140%] w-[140%] -translate-x-1/2" />
      <div className="relative flex items-center justify-between">
        <h2 className="text-[1.6rem] font-black">🏆 Top of the board</h2>
        <span className="text-[1rem] font-semibold text-white/60">Challenge points</span>
      </div>
      {!rows.length ? (
        <div className="relative flex flex-1 flex-col items-center justify-center text-center">
          <Turkey size={px(220)} pose="flex" />
          <p className="mt-[0.6rem] text-[1.8rem] font-black">The podium is wide open!</p>
          <p className="text-[1.2rem] text-white/70">Log a workout in the app to grab the first spot.</p>
        </div>
      ) : (
        <div className="lv-podium-scene relative mt-auto mb-[1.2rem] flex h-[86%] items-end justify-center">
          <div className="lv-podium flex h-full w-[92%] items-end gap-[0.4rem]">
            {slots.map(({ place, h, r }) => (
              <div key={place} className="flex h-full flex-1 flex-col items-center justify-end">
                {r ? (
                  <div className="lv-bob relative mb-[0.8rem] flex flex-col items-center" style={{ animationDelay: `${place * 0.3}s` }}>
                    {place === 1 && (
                      <div className="absolute -top-[3.4rem] z-10">
                        <Crown size={px(64)} />
                      </div>
                    )}
                    <div className="relative">
                      {place === 1 && <div aria-hidden className="lv-halo absolute -inset-[1.6rem] rounded-full" />}
                      {place === 1 && (
                        <>
                          <span className="lv-sparkle -top-[0.5rem] -left-[1rem]" />
                          <span className="lv-sparkle top-[40%] -right-[1.4rem]" style={{ animationDelay: "0.6s" }} />
                          <span className="lv-sparkle -bottom-[0.4rem] left-[10%]" style={{ animationDelay: "1.2s" }} />
                        </>
                      )}
                      <Avatar url={r.avatar_url} name={`${r.first_name} ${r.last_initial}`} size={px(place === 1 ? 118 : 92)} className="ring-4 ring-white/80 shadow-2xl" />
                      <Delta d={deltas[r.user_id]} />
                    </div>
                    <p className={`mt-[0.5rem] max-w-[11rem] truncate text-center font-black ${place === 1 ? "text-[1.7rem]" : "text-[1.35rem]"}`}>
                      {r.first_name} {r.last_initial}.
                    </p>
                    <p className="text-[1.15rem] font-bold text-[#ffd23f]">{r.points} pts</p>
                  </div>
                ) : (
                  <p className="mb-[1rem] text-[1.1rem] font-semibold text-white/50">Open spot</p>
                )}
                <PodiumBlock place={place} height={h}>
                  <Coin3D place={place} size={px(place === 1 ? 84 : 68)} />
                  {r && <p className="relative mt-[0.4rem] text-[0.95rem] font-bold text-black/55">{r.workouts} workouts</p>}
                </PodiumBlock>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute -right-[1rem] bottom-[0.2rem]">
        <Turkey size={px(110)} pose="cheer" delay={0.3} />
      </div>
    </section>
  );
}

function Board({ rows, ranks, deltas }: { rows: Row[]; ranks: number[]; deltas: Record<string, { n: number; key: number }> }) {
  const px = useScale();
  const rest = rows.slice(3, 13);
  const max = Math.max(1, ...rows.map((r) => r.points));
  return (
    <section className="lv-glass flex min-h-0 flex-col overflow-hidden rounded-[1.6rem] p-[1.2rem]" style={{ perspective: "900px" }}>
      <div className="mb-[0.6rem] flex items-center justify-between">
        <h2 className="text-[1.6rem] font-black">📈 Leaderboard</h2>
        <span className="text-[1rem] font-semibold text-white/60">{rows.length} in the challenge</span>
      </div>
      {rest.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-white/70">
          <div className="lv-float3d">
            <Collectible kind="dumbbell" size={px(150)} />
          </div>
          <p className="mt-[0.6rem] text-[1.3rem] font-semibold">More names show up here as people log workouts.</p>
        </div>
      ) : (
        <ol className="flex min-h-0 flex-1 flex-col justify-start gap-[0.45rem]">
          {rest.map((r, i) => (
            <li
              key={r.user_id}
              className="lv-row relative flex items-center gap-[0.8rem] overflow-hidden rounded-[1rem] bg-white/[0.06] px-[0.9rem] py-[0.45rem] ring-1 ring-white/10"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span
                aria-hidden
                className="lv-bar absolute inset-y-0 left-0 bg-gradient-to-r from-[#c8283f]/45 to-[#e8762c]/25"
                style={{ width: `${(r.points / max) * 100}%`, animationDelay: `${300 + i * 90}ms` }}
              />
              <span className="relative w-[2.2rem] text-center text-[1.35rem] font-black text-white/70">{ranks[i + 3]}</span>
              <span className="relative">
                <Avatar url={r.avatar_url} name={`${r.first_name} ${r.last_initial}`} size={px(44)} className="ring-white/40" />
              </span>
              <span className="relative min-w-0 flex-1 truncate text-[1.3rem] font-bold">
                {r.first_name} {r.last_initial}.
              </span>
              <span className="relative text-[1.35rem] font-black tabular-nums">
                {r.points}
                <span className="ml-[0.2rem] text-[0.9rem] font-semibold text-white/60">pts</span>
                <Delta d={deltas[r.user_id]} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Spotlight({ slides }: { slides: { id: string; el: React.ReactNode; mascot?: TurkeyPose }[] }) {
  const px = useScale();
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => x + 1), SLIDE_MS);
    return () => clearInterval(t);
  }, []);
  const idx = i % slides.length;
  const s = slides[idx];
  return (
    <section className="lv-glass relative flex min-h-0 flex-col overflow-hidden rounded-[1.6rem] p-[1.2rem]">
      <div className="mb-[0.8rem] flex gap-[0.35rem]">
        {slides.map((x, j) => (
          <span key={x.id} className="h-[0.35rem] flex-1 overflow-hidden rounded-full bg-white/15">
            {j === idx && <span key={i} className="lv-progress block h-full rounded-full bg-[#ffd23f]" style={{ "--pd": `${SLIDE_MS}ms` } as CSSProperties} />}
            {j < idx && <span className="block h-full w-full rounded-full bg-white/50" />}
          </span>
        ))}
      </div>
      <div key={`${s.id}-${i}`} className="lv-slide flex min-h-0 flex-1 flex-col">
        {s.el}
        {s.mascot && (
          <div className="mt-auto flex items-end justify-center gap-[1rem] pt-[0.6rem]">
            <JingleBells size={px(64)} />
            <Turkey size={px(160)} pose={s.mascot} />
            <JingleBells size={px(64)} className="-scale-x-100" />
          </div>
        )}
      </div>
    </section>
  );
}

function Tile({ label, value, emoji, color, i }: { label: string; value: number; emoji: string; color: string; i: number }) {
  const v = useCountUp(value);
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.1rem] p-[1rem] ring-1 ring-white/10" style={{ background: `linear-gradient(140deg, ${color}66, ${color}18)` }}>
      <div>
        <p className="text-[3.4rem] leading-none font-black tabular-nums [text-shadow:0_4px_14px_rgb(0_0_0/0.35)]">{v.toLocaleString()}</p>
        <p className="mt-[0.35rem] text-[1.05rem] leading-tight font-semibold text-white/80">{label}</p>
      </div>
      <span aria-hidden className="absolute right-[0.4rem] bottom-[0.2rem] size-[5.5rem] rounded-full blur-2xl" style={{ background: `${color}` }} />
      <span className="lv-float3d relative self-end text-[4.2rem] leading-none" style={{ "--fd": `${i * -1.3}s` } as CSSProperties}>
        <span className="inline-block">{emoji}</span>
      </span>
    </div>
  );
}

function StatsSlide({ stats }: { stats: { weekWorkouts: number; todayActive: number; weekClasses: number; totalPoints: number } }) {
  return (
    <>
      <h3 className="text-[1.6rem] font-black">🔥 The crew this week</h3>
      <div className="mt-[0.8rem] grid flex-1 grid-cols-2 gap-[0.7rem]">
        <Tile i={0} label="workouts this week" value={stats.weekWorkouts} emoji="💪" color="#c8283f" />
        <Tile i={1} label="members moving today" value={stats.todayActive} emoji="👟" color="#1f8a5b" />
        <Tile i={2} label="classes this week" value={stats.weekClasses} emoji="🔥" color="#e8762c" />
        <Tile i={3} label="challenge points earned" value={stats.totalPoints} emoji="⭐" color="#3f74c9" />
      </div>
    </>
  );
}

function HustleSlide({ hustle, minDays }: { hustle: { id: string; days: number; p?: Person }[]; minDays: number }) {
  const px = useScale();
  return (
    <>
      <h3 className="text-[1.6rem] font-black">💪 Hustle this week</h3>
      <p className="text-[1.05rem] text-white/70">Workout days since Monday. {minDays} days = a prize wheel spin!</p>
      {!hustle.length ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <Turkey size={px(180)} pose="flex" />
          <p className="text-[1.3rem] font-bold">Who&apos;s first this week?</p>
        </div>
      ) : (
        <ul className="mt-[0.8rem] space-y-[0.6rem]">
          {hustle.map((h, i) => (
            <li key={h.id} className="lv-row flex items-center gap-[0.7rem]" style={{ animationDelay: `${i * 110}ms` }}>
              <Avatar url={h.p!.avatar_url} name={`${h.p!.first_name} ${h.p!.last_name}`} size={px(40)} className="ring-white/40" />
              <span className="w-[7.5rem] truncate text-[1.2rem] font-bold">
                {h.p!.first_name} {h.p!.last_name.slice(0, 1)}.
              </span>
              <span className="flex flex-1 gap-[0.25rem]">
                {Array.from({ length: 7 }, (_, d) => (
                  <span
                    key={d}
                    className={`lv-bar h-[1.3rem] flex-1 rounded-[0.35rem] ${d < h.days ? (d < minDays ? "bg-gradient-to-b from-[#ff9f1a] to-[#c8283f]" : "bg-gradient-to-b from-[#ffe08a] to-[#e0a10f]") : "bg-white/10"}`}
                    style={{ animationDelay: `${i * 110 + d * 60}ms` }}
                  />
                ))}
              </span>
              {h.days >= minDays && <span className="text-[1.4rem]">🎡</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function WheelSlide({ spins, name, minDays }: { spins: Spin[]; name: (id: string) => string; minDays: number }) {
  return (
    <>
      <h3 className="text-[1.6rem] font-black">🎡 Prize wheel</h3>
      <p className="mt-[0.3rem] text-[1.2rem] leading-snug font-semibold text-white/85">
        Work out <b className="text-[#ffd23f]">{minDays} different days</b> in a week to spin for real prizes!
      </p>
      <div className="relative mx-auto my-[1rem] shrink-0">
        <div className="lv-wheel size-[11rem] rounded-full" />
        <span className="hub-pulse absolute top-1/2 left-1/2 size-[2.2rem] -translate-1/2 rounded-full bg-[#ffd23f] ring-4 ring-[#8a5800]" />
        <span className="absolute -top-[1.1rem] left-1/2 -translate-x-1/2 text-[2rem] drop-shadow-lg">🔻</span>
        <span className="lv-sparkle -top-[0.3rem] -left-[0.6rem]" />
        <span className="lv-sparkle top-[45%] -right-[1rem]" style={{ animationDelay: "0.7s" }} />
        <span className="lv-sparkle -bottom-[0.5rem] left-[20%]" style={{ animationDelay: "1.3s" }} />
      </div>
      {spins.length > 0 ? (
        <>
          <p className="text-[1rem] font-bold tracking-widest text-white/60 uppercase">Recent winners</p>
          <ul className="mt-[0.4rem] space-y-[0.4rem]">
            {spins.slice(0, 4).map((s, i) => (
              <li key={s.id} className="lv-row flex items-center gap-[0.6rem] rounded-[0.8rem] bg-white/[0.07] px-[0.8rem] py-[0.4rem] text-[1.15rem]" style={{ animationDelay: `${i * 100}ms` }}>
                <span>🎁</span>
                <b className="shrink-0">{name(s.user_id)}</b>
                <span className="truncate text-white/75">won {s.prize_name}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-center text-[1.15rem] text-white/70">Show your certificate at the front desk to claim your prize.</p>
      )}
    </>
  );
}

function CoachSlide({ text, coach, photo }: { text: string; coach: string; photo: string }) {
  const px = useScale();
  return (
    <>
      <h3 className="text-[1.6rem] font-black">💬 Today&apos;s message</h3>
      <div className="mt-[0.8rem] flex items-center gap-[0.8rem]">
        <Avatar url={photo || null} name={coach} size={px(64)} className="ring-[#ffd23f]" />
        <p className="text-[1.3rem] font-bold">{coach}</p>
      </div>
      <p className="mt-[0.8rem] line-clamp-[9] text-[1.35rem] leading-snug text-white/90">{text}</p>
    </>
  );
}

function TipSlide({ title, body }: { title: string | null; body: string }) {
  const px = useScale();
  return (
    <>
      <h3 className="text-[1.6rem] font-black">🥗 Tip of the day</h3>
      <div className="mt-[0.6rem] flex justify-center">
        <div className="lv-float3d">
          <Collectible kind="apple" size={px(120)} />
        </div>
      </div>
      {title && <p className="mt-[0.4rem] text-[1.45rem] font-black text-[#ffd23f]">{title}</p>}
      <p className="mt-[0.4rem] line-clamp-6 text-[1.25rem] leading-snug text-white/90">{body}</p>
    </>
  );
}

function JoinSlide({ qr, code }: { qr: string; code?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h3 className="text-[1.7rem] font-black">📱 Not in yet? Scan to join!</h3>
      <div className="lv-bob mt-[0.8rem] rounded-[1.2rem] bg-white p-[0.7rem] shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR code to join the challenge" className="size-[11rem]" />
      </div>
      {code && (
        <p className="mt-[0.7rem] text-[1.2rem] font-semibold">
          Join code: <b className="tracking-widest text-[#ffd23f]">{code}</b>
        </p>
      )}
      <p className="text-[1.05rem] text-white/70">It&apos;s free. Ask us at the desk!</p>
    </div>
  );
}

function Ticker({ feed, name }: { feed: Workout[]; name: (id: string) => string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const items = feed.length
    ? feed.slice(0, 14).map((w) => `${EMOJI[w.location]} ${name(w.user_id)} ${describe(w)} · ${ago(w.created_at, now)}`)
    : ["🦃 Welcome to the Maintain, Don't Gain live board!", "📱 Log every workout in the app to climb the leaderboard", "🎡 5 workout days in a week = spin the prize wheel"];
  const loop = [...items, ...items];
  return (
    <div className="relative flex h-[3.4rem] items-center overflow-hidden bg-gradient-to-r from-[#8f1428] via-[#c8283f] to-[#e8762c]">
      <span className="relative z-10 flex h-full shrink-0 items-center gap-[0.5rem] bg-[#1d1a17] px-[1.2rem] text-[1.1rem] font-black tracking-widest uppercase">
        <span className="lv-live-dot size-[0.6rem] rounded-full bg-[#ff3d5a]" /> Just now
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="lv-ticker" style={{ "--tdur": `${Math.max(30, items.length * 7)}s` } as CSSProperties}>
          {loop.map((t, i) => (
            <span key={i} className="shrink-0 px-[1.6rem] text-[1.3rem] font-bold whitespace-nowrap">
              {t}
              <span className="ml-[3.2rem] text-white/50">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Floaters() {
  const px = useScale();
  const items: { kind: CollectibleKind; style: CSSProperties; size: number }[] = [
    { kind: "star", size: 70, style: { top: "13%", left: "39.5%", "--fd": "-1s" } as CSSProperties },
    { kind: "dumbbell", size: 84, style: { bottom: "16%", left: "36%", "--fd": "-2.5s" } as CSSProperties },
    { kind: "medal", size: 66, style: { top: "12%", right: "29%", "--fd": "-4s" } as CSSProperties },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {items.map((it, i) => (
        <div key={i} className="lv-float3d absolute opacity-90" style={it.style}>
          <div>
            <Collectible kind={it.kind} size={px(it.size)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MomentOverlay({ m }: { m: Moment }) {
  const px = useScale();
  return (
    <div className="fade fixed inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-[3px]">
      <Confetti />
      <div className="lv-burst relative flex items-center gap-[2rem] rounded-[2.2rem] bg-gradient-to-br from-[#2a0f12] via-[#3a1414] to-[#1a2a20] px-[3rem] py-[2.2rem] shadow-[0_40px_80px_-20px_rgb(0_0_0/0.8)] ring-2 ring-[#ffd23f]/60">
        <Turkey size={px(190)} pose="cheer" />
        <div className="relative flex size-[15rem] items-center justify-center">
          <div aria-hidden className="celebrate-rays absolute inset-0 rounded-full" />
          <div className="celebrate-spin relative" style={{ perspective: "600px" }}>
            <Collectible kind={m.kind} size={px(190)} />
          </div>
        </div>
        <div className="max-w-[30rem]">
          <p className="text-[1.1rem] font-black tracking-[0.3em] text-[#ffd23f] uppercase">Just logged!</p>
          <div className="mt-[0.4rem] flex items-center gap-[0.8rem]">
            <Avatar url={m.avatar} name={m.name} size={px(72)} className="ring-4 ring-[#ffd23f]" />
            <p className="text-[2.8rem] leading-none font-black">{m.name}</p>
          </div>
          <p className="mt-[0.7rem] text-[1.7rem] leading-tight font-semibold text-white/90">{m.line}!</p>
          {m.points > 0 && <p className="celebrate-pop mt-[1rem] inline-block rounded-full bg-[#ffd23f] px-[1.3rem] py-[0.4rem] text-[1.8rem] font-black text-[#4a2c00]">+{m.points} pts</p>}
        </div>
        <Turkey size={px(190)} pose="cheer" delay={0.35} className="-scale-x-100" />
      </div>
    </div>
  );
}
