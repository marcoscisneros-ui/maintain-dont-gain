"use client";

import { useEffect, useState } from "react";
import { ImageField } from "@/components/ImageField";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { loadSettings, type Settings } from "@/lib/settings";

const KEYS = [
  "coach_name", "coach_title", "coach_photo_url", "groupme_url", "class_url_ios", "class_url_android", "class_url", "join_code",
  "points_home", "points_gym", "points_class", "points_pt", "class_names", "daily_point_cap", "start_date", "end_date",
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
    for (const u of ["groupme_url", "class_url_ios", "class_url_android", "class_url"] as const)
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
