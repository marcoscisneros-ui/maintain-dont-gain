"use client";

import { useEffect, useState } from "react";
import { ImageField } from "@/components/ImageField";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { loadSettings, type Settings } from "@/lib/settings";
import { formatDate } from "@/lib/dates";

const KEYS = [
  "coach_name", "coach_title", "coach_photo_url", "groupme_url", "facebook_url", "class_url_ios", "class_url_android", "class_url", "join_code",
  "points_home", "points_gym", "points_class", "points_pt", "class_names", "daily_point_cap", "spin_min_days", "bonus_days", "bonus_multiplier", "start_date", "end_date",
] as const;
type Key = (typeof KEYS)[number];

export function SettingsPanel() {
  const [s, setS] = useState<Record<Key, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings(true).then((v: Settings) => setS(Object.fromEntries(KEYS.map((k) => [k, v[k] ?? ""])) as Record<Key, string>));
  }, []);

  if (!s) return <div className="h-64 animate-pulse rounded-3xl bg-card" />;
  const set = (k: Key) => (v: string) => {
    setS({ ...s, [k]: v });
    setSaved(false);
  };
  const bind = (k: Key) => ({ value: s[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k)(e.target.value) });

  async function save() {
    setError("");
    for (const u of ["groupme_url", "facebook_url", "class_url_ios", "class_url_android", "class_url"] as const)
      if (s![u] && !/^https?:\/\//.test(s![u].trim())) return setError("Links need to start with https://");
    if (s!.start_date > s!.end_date) return setError("The start date has to be before the end date.");
    setBusy(true);
    const rows = KEYS.map((key) => ({ key, value: (s![key] ?? "").trim() }));
    const { error } = await supabase().from("settings").upsert(rows);
    setBusy(false);
    if (error) return setError(error.message);
    await loadSettings(true);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <a href="/poster" className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-[#c8283f] to-[#e8762c] p-4 text-white shadow-card">
        <span className="text-2xl">🖨️</span>
        <span className="flex-1">
          <span className="block font-bold">Front-desk QR poster</span>
          <span className="block text-sm text-white/85">Print a &quot;Scan to join&quot; sign for the counter</span>
        </span>
        <span className="text-xl">›</span>
      </a>
      <Card className="space-y-4">
        <h3 className="font-semibold">You (shown on daily messages)</h3>
        <ImageField value={s.coach_photo_url || null} onChange={(u) => set("coach_photo_url")(u ?? "")} folder="coach" label="Upload your headshot" round />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <Input {...bind("coach_name")} className="text-base" />
          </Field>
          <Field label="Title">
            <Input {...bind("coach_title")} className="text-base" />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-semibold">Links</h3>
        <Field label="GroupMe invite link" hint="In GroupMe: open the group → Settings → Share group → copy link.">
          <Input {...bind("groupme_url")} placeholder="https://groupme.com/join_group/…" className="text-base" inputMode="url" autoCapitalize="none" />
        </Field>
        <Field label="Facebook community group link" hint={'Shown under "Encourage someone else to get their workout today" on Home and Crew.'}>
          <Input {...bind("facebook_url")} placeholder="https://www.facebook.com/groups/…" className="text-base" inputMode="url" autoCapitalize="none" />
        </Field>
        <div className="space-y-3 rounded-2xl bg-card-2 p-4">
          <div>
            <p className="font-medium">Book a class</p>
            <p className="text-xs text-muted">
              Members see one &quot;Book a class&quot; button. The app sends iPhones to the App Store link and Android phones to
              the Google Play link automatically.
            </p>
          </div>
          <Field label="🍎 iPhone (App Store link)">
            <Input {...bind("class_url_ios")} placeholder="https://apps.apple.com/…" className="text-base" inputMode="url" autoCapitalize="none" />
          </Field>
          <Field label="🤖 Android (Google Play link)">
            <Input {...bind("class_url_android")} placeholder="https://play.google.com/store/apps/…" className="text-base" inputMode="url" autoCapitalize="none" />
          </Field>
          <Field label="💻 Website (optional)" hint="Used on computers, or if a phone link is missing.">
            <Input {...bind("class_url")} placeholder="https://…" className="text-base" inputMode="url" autoCapitalize="none" />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-semibold">Points</h3>
        <BonusDays
          value={s.bonus_days}
          multiplier={s.bonus_multiplier}
          startDate={s.start_date}
          endDate={s.end_date}
          onChange={set("bonus_days")}
          onMultiplier={set("bonus_multiplier")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="🏠 Home">
            <Input {...bind("points_home")} type="number" inputMode="numeric" suffix="pts" />
          </Field>
          <Field label="🏋️ Gym">
            <Input {...bind("points_gym")} type="number" inputMode="numeric" suffix="pts" />
          </Field>
          <Field label="🔥 Class">
            <Input {...bind("points_class")} type="number" inputMode="numeric" suffix="pts" />
          </Field>
          <Field label="🤝 Personal training">
            <Input {...bind("points_pt")} type="number" inputMode="numeric" suffix="pts" />
          </Field>
        </div>
        <Field label="Workout days per week to earn a prize-wheel spin" hint="Counts different days, Monday–Sunday.">
          <Input {...bind("spin_min_days")} type="number" inputMode="numeric" suffix="days" />
        </Field>
        <Field label="Max points per day" hint="Stops anyone from logging 10 workouts in one day. 0 = no limit.">
          <Input {...bind("daily_point_cap")} type="number" inputMode="numeric" suffix="pts" />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-semibold">Challenge</h3>
        <Field label="Class list" hint="The classes members pick from when they log a class. Separate with commas. They can also type one that isn't listed.">
          <Input {...bind("class_names")} className="text-base" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <Input {...bind("start_date")} type="date" className="text-base" />
          </Field>
          <Field label="End date">
            <Input {...bind("end_date")} type="date" className="text-base" />
          </Field>
        </div>
        <Field label="Join code (optional)" hint="If set, new members must enter this code to sign up. Leave blank so anyone with the link can join.">
          <Input {...bind("join_code")} placeholder="e.g. HOLDTHELINE" className="text-base" autoCapitalize="characters" />
        </Field>
      </Card>

      <ErrorText>{error}</ErrorText>
      <div className="sticky bottom-24 z-10">
        <Button className="w-full" onClick={save} loading={busy}>
          {saved ? "Saved ✓" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}

/** Pick dates where every workout earns extra points (e.g. 2X on Black Friday). */
function BonusDays({
  value,
  multiplier,
  startDate,
  endDate,
  onChange,
  onMultiplier,
}: {
  value: string;
  multiplier: string;
  startDate: string;
  endDate: string;
  onChange: (v: string) => void;
  onMultiplier: (v: string) => void;
}) {
  const [pick, setPick] = useState("");
  const days = value.split(",").map((d) => d.trim()).filter(Boolean).sort();
  const save = (list: string[]) => onChange([...new Set(list)].sort().join(","));

  // Holiday suggestions for this challenge's year
  const y = Number(startDate.slice(0, 4));
  const nov1 = new Date(Date.UTC(y, 10, 1)).getUTCDay();
  const thanksgiving = 1 + ((4 - nov1 + 7) % 7) + 21;
  const iso = (m: number, d: number, yr = y) => `${yr}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const ideas = [
    { d: iso(11, thanksgiving - 1), label: "Thanksgiving Eve" },
    { d: iso(11, thanksgiving + 1), label: "Black Friday" },
    { d: iso(12, 24), label: "Christmas Eve" },
    { d: iso(12, 26), label: "Dec 26" },
    { d: iso(12, 31), label: "New Year's Eve" },
    { d: iso(1, 1, y + 1), label: "New Year's Day" },
  ].filter((i) => i.d >= startDate && i.d <= endDate && !days.includes(i.d));

  return (
    <div className="space-y-3 rounded-2xl bg-card-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">🔥 Bonus point days</p>
          <p className="text-xs text-muted">Workouts on these days earn extra points. Members see a banner that day.</p>
        </div>
        <label className="flex items-center gap-1 text-sm font-bold">
          <input
            type="number"
            inputMode="numeric"
            min={2}
            max={5}
            value={multiplier}
            onChange={(e) => onMultiplier(e.target.value)}
            className="h-10 w-12 rounded-xl bg-card text-center ring-1 ring-line outline-none"
            aria-label="Points multiplier"
          />
          X
        </label>
      </div>
      {days.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <span key={d} className="inline-flex items-center gap-1 rounded-full bg-brand/12 py-1 pr-1 pl-3 text-sm font-semibold text-brand">
              {formatDate(d, { weekday: "short", month: "short", day: "numeric" })}
              <button onClick={() => save(days.filter((x) => x !== d))} className="rounded-full px-1.5 text-base leading-none" aria-label={`Remove ${d}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input type="date" value={pick} min={startDate} max={endDate} onChange={(e) => setPick(e.target.value)} className="h-10 bg-card text-sm" />
        <button
          type="button"
          disabled={!pick}
          onClick={() => {
            save([...days, pick]);
            setPick("");
          }}
          className="rounded-xl bg-ink px-4 text-sm font-bold text-bg disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {ideas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ideas.map((i) => (
            <button key={i.d} type="button" onClick={() => save([...days, i.d])} className="rounded-full px-3 py-1 text-xs font-medium ring-1 ring-line">
              + {i.label}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">Don&apos;t forget to tap Save settings.</p>
    </div>
  );
}
