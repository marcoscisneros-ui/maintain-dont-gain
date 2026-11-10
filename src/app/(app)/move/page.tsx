"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { weekStart as mondayOf } from "@/lib/rewards";
import { CalendarPlus, Footprints, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { DatePager } from "@/components/DatePager";
import { useToast } from "@/components/Toast";
import { isMilestone, useCelebrate } from "@/components/Celebration";
import { Button, ButtonLink, Card, Chip, ErrorText, Input, PageHeader, SectionTitle, cn } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/lib/settings";
import { classLink } from "@/lib/classLink";
import { addDays, formatDate, todayISO } from "@/lib/dates";
import { LOCATIONS, pointValues, pointsForDay, type Location } from "@/lib/points";
import { StarRating } from "@/components/StarRating";
import { sessionsLeft } from "@/lib/tiers";

type Workout = { id: number; date: string; location: Location; activity: string; minutes: number | null; notes: string | null; rating: number | null };
const ACTIVITIES = ["Strength", "Cardio", "Walk / Run", "Cycling", "HIIT", "Yoga / Stretch", "Sports", "Other"];
const MINUTES = [15, 30, 45, 60, 90];

export default function MovePage() {
  const { profile } = useAuth();
  const settings = useSettings();
  const toast = useToast();
  const celebrate = useCelebrate();
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [steps, setSteps] = useState("");
  const [savedSteps, setSavedSteps] = useState<number | null>(null);
  const [week, setWeek] = useState<{ steps: Record<string, number>; workouts: Workout[] }>({ steps: {}, workouts: [] });
  const [loc, setLoc] = useState<Location | null>(null);
  const [activity, setActivity] = useState("Strength");
  const [minutes, setMinutes] = useState<number | null>(45);
  const [notes, setNotes] = useState("");
  const [className, setClassName] = useState("");
  const [otherClass, setOtherClass] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const weekStart = addDays(date, -6);

  const load = useCallback(async () => {
    if (!profile) return;
    const sb = supabase();
    const [s, w] = await Promise.all([
      sb.from("daily_steps").select("date,steps").eq("user_id", profile.id).gte("date", weekStart).lte("date", date),
      sb.from("workouts").select("*").eq("user_id", profile.id).gte("date", weekStart).lte("date", date).order("created_at"),
    ]);
    const stepMap: Record<string, number> = {};
    for (const r of s.data ?? []) stepMap[r.date] = r.steps;
    setWeek({ steps: stepMap, workouts: (w.data ?? []) as Workout[] });
    setSavedSteps(stepMap[date] ?? null);
    setSteps(stepMap[date] != null ? String(stepMap[date]) : "");
  }, [profile, date, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  if (!profile || !settings) return null;
  const pv = pointValues(settings);
  const classNames = (settings.class_names || "").split(",").map((c) => c.trim()).filter(Boolean);
  const left = sessionsLeft(profile);
  const dayWorkouts = week.workouts.filter((w) => w.date === date);
  const dayPoints = pointsForDay(dayWorkouts.map((w) => w.location), date, settings);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekPoints = days.reduce(
    (s, d) => s + pointsForDay(week.workouts.filter((w) => w.date === d).map((w) => w.location), d, settings),
    0,
  );
  const weekSteps = days.reduce((s, d) => s + (week.steps[d] ?? 0), 0);
  const weekMinutes = week.workouts.reduce((s, w) => s + (w.minutes ?? 0), 0);
  const maxSteps = Math.max(profile.step_goal, ...days.map((d) => week.steps[d] ?? 0));
  const inChallenge = date >= settings.start_date && date <= settings.end_date;

  async function saveSteps(e: React.FormEvent) {
    e.preventDefault();
    const n = Math.round(Number(steps));
    if (!(n >= 0 && n < 200000)) return;
    const { error } = await supabase()
      .from("daily_steps")
      .upsert({ user_id: profile!.id, date, steps: n, updated_at: new Date().toISOString() });
    if (error) return toast.show("Couldn't save steps");
    if (n >= profile!.step_goal && (savedSteps ?? 0) < profile!.step_goal) {
      celebrate({ kind: "medal", title: "Step goal crushed!", subtitle: `${n.toLocaleString()} steps today` });
    } else {
      toast.show(`${n.toLocaleString()} steps saved ✓`);
    }
    (document.activeElement as HTMLElement | null)?.blur();
    load();
  }

  async function logWorkout() {
    setError("");
    if (!loc) return setError("Where did you work out?");
    const what =
      loc === "class" ? (className === "Other" ? otherClass.trim() : className) : loc === "pt" ? "Personal training" : activity;
    if (loc === "class" && !what) return setError("Which class did you take?");
    setBusy(true);
    const rated = loc === "class" || loc === "pt";
    const { error } = await supabase()
      .from("workouts")
      .insert({ date, location: loc, activity: what, minutes, notes: notes.trim() || null, rating: rated ? rating : null });
    setBusy(false);
    if (error) return setError("Couldn't save. Check your connection.");
    const after = pointsForDay([...dayWorkouts.map((w) => w.location), loc], date, settings!);
    const gained = after - dayPoints;
    const total = await countMine("workouts", profile!.id);

    // 5th different workout day this week (Mon–Sun)? Trophy time!
    const minDays = Number(settings!.spin_min_days) || 5;
    const ws = mondayOf(date);
    const inChallengeDay = date >= settings!.start_date && date <= settings!.end_date;
    let trophyEarned = false;
    if (inChallengeDay && dayWorkouts.length === 0) {
      const { data: wk } = await supabase()
        .from("workouts")
        .select("date")
        .eq("user_id", profile!.id)
        .gte("date", ws)
        .lte("date", addDays(ws, 6));
      const days = new Set((wk ?? []).map((r) => r.date as string).filter((d) => d >= settings!.start_date && d <= settings!.end_date));
      if (days.size === minDays) {
        trophyEarned = true;
        celebrate({
          kind: "trophy",
          title: `${minDays}-Workout Week! 🏆`,
          subtitle: `You earned a trophy and a prize wheel spin, ${profile!.first_name}!`,
          points: gained,
          milestone: true,
          action: {
            label: "🏆 Get my trophy",
            onClick: () => {
              try {
                sessionStorage.setItem("mdg-open-trophy", ws);
              } catch {}
              router.push("/rewards");
            },
          },
        });
      }
    }

    if (!trophyEarned) celebrate({
      kind: "dumbbell",
      title: `Dumbbell #${total} collected!`,
      subtitle: total === 1 ? "Your first workout is in the books 💪" : `${what} logged. Keep stacking them.`,
      points: gained,
      milestone: isMilestone(total) && total > 1,
    });
    setLoc(null);
    setNotes("");
    setClassName("");
    setOtherClass("");
    setRating(null);
    load();
  }

  async function remove(id: number) {
    await supabase().from("workouts").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4 pt-6">
      {toast.node}
      <PageHeader title="Move" subtitle="Every bit of movement counts." />
      <DatePager value={date} onChange={setDate} />

      {/* Workout */}
      <Card className="rise space-y-4">
        <SectionTitle
          right={
            <span className="rounded-full bg-gold/15 px-3 py-1 text-sm font-semibold text-gold">
              {dayPoints} pt{dayPoints === 1 ? "" : "s"} {date === todayISO() ? "today" : ""}
            </span>
          }
        >
          Log a workout
        </SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {LOCATIONS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => { setLoc(l.id); setError(""); }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-4 ring-1 transition active:scale-[0.97]",
                loc === l.id ? "bg-brand/10 ring-2 ring-brand" : "bg-card-2 ring-line",
              )}
            >
              <span className="text-2xl">{l.emoji}</span>
              <span className="text-sm font-semibold">{l.label}</span>
              <span className="text-xs font-semibold text-gold">+{pv[l.id]} pt{pv[l.id] === 1 ? "" : "s"}</span>
            </button>
          ))}
        </div>

        {loc && (
          <div className="fade space-y-4">
            {loc === "class" && classLink(settings) && (
              <ButtonLink href={classLink(settings)} external variant="secondary" className="w-full text-sm">
                <CalendarPlus className="size-4" /> Book your next class
              </ButtonLink>
            )}
            {loc === "class" && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted">Which class?</p>
                <div className="flex flex-wrap gap-2">
                  {[...classNames, "Other"].map((c) => (
                    <Chip key={c} selected={className === c} onClick={() => { setClassName(c); setError(""); }}>
                      {c}
                    </Chip>
                  ))}
                </div>
                {className === "Other" && (
                  <Input value={otherClass} onChange={(e) => setOtherClass(e.target.value)} placeholder="Class name" className="fade mt-2 text-base" autoFocus />
                )}
              </div>
            )}
            {loc === "pt" && left != null && (
              <p className="rounded-2xl bg-gold/12 px-4 py-3 text-sm font-medium">
                {profile.tier === "diamond" ? "💎" : "🥇"} You have <b>{left}</b> personal training session{left === 1 ? "" : "s"} left. Staff
                update this after each session.
              </p>
            )}
            {(loc === "home" || loc === "gym") && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted">What did you do?</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITIES.map((a) => (
                    <Chip key={a} selected={activity === a} onClick={() => setActivity(a)}>
                      {a}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 text-sm font-medium text-muted">How long?</p>
              <div className="flex flex-wrap gap-2">
                {MINUTES.map((m) => (
                  <Chip key={m} selected={minutes === m} onClick={() => setMinutes(minutes === m ? null : m)}>
                    {m} min
                  </Chip>
                ))}
              </div>
            </div>
            {(loc === "class" || loc === "pt") && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted">
                  How was it? <span className="font-normal">(optional)</span>
                </p>
                <StarRating value={rating} onChange={setRating} />
              </div>
            )}
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={loc === "class" || loc === "pt" ? "Comments for the coach (optional)" : "Notes (optional)"}
              className="text-base"
            />
          </div>
        )}
        <ErrorText>{error}</ErrorText>
        <Button className="w-full" onClick={logWorkout} loading={busy} disabled={!loc}>
          Log workout
        </Button>
        {!inChallenge && (
          <p className="text-center text-xs text-muted">
            Points count from {formatDate(settings.start_date)} to {formatDate(settings.end_date)}.
          </p>
        )}
        {dayWorkouts.length > 0 && (
          <ul className="divide-y divide-line border-t border-line">
            {dayWorkouts.map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-3">
                <span className="text-xl">{LOCATIONS.find((l) => l.id === w.location)?.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {w.activity}
                    {w.minutes ? <span className="text-muted"> · {w.minutes} min</span> : null}
                  </p>
                  {w.rating != null && <StarRating value={w.rating} size={13} />}
                  {w.notes && <p className="truncate text-xs text-muted">{w.notes}</p>}
                </div>
                <button onClick={() => remove(w.id)} className="rounded-lg p-2 text-muted active:text-danger" aria-label="Delete">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Steps */}
      <form onSubmit={saveSteps}>
        <Card className="rise" style={{ animationDelay: "40ms" }}>
          <SectionTitle
            right={
              savedSteps != null && savedSteps >= profile.step_goal ? (
                <span className="text-sm font-semibold text-accent">Goal hit ✓</span>
              ) : undefined
            }
          >
            Steps
          </SectionTitle>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="number"
                inputMode="numeric"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder={`Goal ${profile.step_goal.toLocaleString()}`}
                suffix="steps"
              />
            </div>
            <Button type="submit" className="px-6">
              <Footprints className="size-5" /> Save
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted">Copy the number from your phone&apos;s Health / Fitness app or watch.</p>
        </Card>
      </form>

      {/* Weekly summary */}
      <Card className="rise" style={{ animationDelay: "80ms" }}>
        <SectionTitle>Last 7 days</SectionTitle>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat value={weekPoints} label="points" color="text-gold" />
          <Stat value={week.workouts.length} label="workouts" color="text-brand" />
          <Stat value={weekMinutes} label="minutes" color="text-violet" />
        </div>
        <div className="mt-5 flex items-end gap-2">
          {days.map((d) => {
            const s = week.steps[d] ?? 0;
            const hasWorkout = week.workouts.some((w) => w.date === d);
            return (
              <div key={d} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="flex h-24 w-full items-end">
                  <div
                    className={cn("w-full rounded-lg transition-all duration-700", s >= profile.step_goal ? "bg-accent" : "bg-accent/40")}
                    style={{ height: `${Math.max(4, (s / maxSteps) * 100)}%` }}
                  />
                </div>
                <span className={cn("size-1.5 rounded-full", hasWorkout ? "bg-brand" : "bg-transparent")} />
                <span className={cn("text-[11px]", d === date ? "font-bold text-ink" : "text-muted")}>
                  {formatDate(d, { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          {weekSteps.toLocaleString()} steps this week · <span className="text-brand">●</span> = workout day
        </p>
      </Card>
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-2xl bg-card-2 py-3">
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

async function countMine(table: string, userId: string): Promise<number> {
  const { count } = await supabase().from(table).select("user_id", { count: "exact", head: true }).eq("user_id", userId);
  return count ?? 0;
}
