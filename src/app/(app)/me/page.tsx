"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { AvatarPicker } from "@/components/AvatarPicker";
import { Button, Card, ErrorText, Field, Input, PageHeader, Toggle } from "@/components/ui";
import { playTada, setSoundEnabled, soundEnabled } from "@/lib/sound";
import { NotificationsCard } from "@/components/NotificationsCard";
import { supabase } from "@/lib/supabase";
import { HeightInput, isValidHeight } from "@/components/HeightInput";
import { formatPhone, isValidPhone, phoneDigits } from "@/lib/phone";
import { TierBadge } from "@/components/TierBadge";
import { TIERS, sessionsLeft } from "@/lib/tiers";

export default function MePage() {
  const router = useRouter();
  const { profile, refreshProfile, signOut } = useAuth();
  const [weight, setWeight] = useState(profile?.start_weight?.toString() ?? "");
  const [height, setHeight] = useState(profile?.height_in?.toString() ?? "");
  const [phone, setPhone] = useState(formatPhone(profile?.phone));
  const [calories, setCalories] = useState(profile?.calorie_target?.toString() ?? "");
  const [steps, setSteps] = useState(profile?.step_goal?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [sound, setSound] = useState(true);
  useEffect(() => setSound(soundEnabled()), []);
  const [error, setError] = useState("");

  if (!profile) return null;
  const name = `${profile.first_name} ${profile.last_name}`;

  async function saveAvatar(url: string) {
    await supabase().from("profiles").update({ avatar_url: url }).eq("id", profile!.id);
    await refreshProfile();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    const c = Number(calories);
    if (!(c >= 1000 && c <= 6000)) return setError("Calorie target should be between 1,000 and 6,000.");
    if (height && !isValidHeight(height)) return setError("Check your height (feet and inches).");
    if (phone && !isValidPhone(phone)) return setError("Check your phone number (10 digits).");
    setBusy(true);
    const { error } = await supabase()
      .from("profiles")
      .update({
        start_weight: weight ? Number(weight) : null,
        height_in: height ? Number(height) : null,
        phone: phone ? phoneDigits(phone) : null,
        calorie_target: c,
        step_goal: Number(steps) || 8000,
      })
      .eq("id", profile!.id);
    setBusy(false);
    if (error) return setError("Couldn't save. Try again.");
    await refreshProfile();
    setMsg("Saved!");
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div className="pt-6">
      <PageHeader title="My profile" />
      <Card className="rise flex flex-col items-center text-center">
        <AvatarPicker userId={profile.id} name={name} url={profile.avatar_url} onChange={saveAvatar} />
        <p className="mt-4 text-xl font-bold">{name}</p>
        <p className="text-muted">
          Username: <span className="font-semibold text-ink">{profile.username}</span>
        </p>
        {profile.is_admin && (
          <span className="mt-2 rounded-full bg-violet/15 px-3 py-1 text-xs font-semibold text-violet">Admin</span>
        )}
      </Card>

      <Card className="rise mt-4" style={{ animationDelay: "30ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">My level</h2>
          <TierBadge tier={profile.tier ?? "free"} pending={profile.tier_status === "pending"} showFree />
        </div>
        {profile.tier_status === "pending" ? (
          <p className="mt-2 text-sm text-muted">
            Stop by the front desk to pay for {TIERS[profile.tier].label}. Staff will activate it, and your personal training sessions will show up here.
          </p>
        ) : sessionsLeft(profile) != null ? (
          <>
            <p className="mt-3 text-3xl font-bold">
              {sessionsLeft(profile)} <span className="text-base font-semibold text-muted">of {TIERS[profile.tier].sessions} personal training sessions left</span>
            </p>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: TIERS[profile.tier].sessions }, (_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${i < profile.sessions_used ? "bg-line" : "brand-gradient"}`} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Staff update this after each session. Log each one on the Move tab for points.</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Want a coach in your corner? 🥇 <b>Gold</b> adds 4 personal training sessions and 💎 <b>Diamond</b> adds 8. Ask at the front desk.
          </p>
        )}
      </Card>

      {profile.is_admin && (
        <Link
          href="/admin"
          className="rise mt-4 flex items-center gap-4 rounded-3xl bg-violet/12 p-5 ring-1 ring-violet/25 transition active:scale-[0.99]"
        >
          <ShieldCheck className="size-7 text-violet" />
          <div>
            <p className="font-semibold">Admin area</p>
            <p className="text-sm text-muted">Members, posts, daily messages, settings</p>
          </div>
        </Link>
      )}

      <form onSubmit={save} className="mt-4">
        <Card className="rise space-y-5" style={{ animationDelay: "60ms" }}>
          <h2 className="font-semibold">My numbers</h2>
          <Field label="Cell phone" hint="Only staff can see this.">
            <Input type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(325) 555-0123" />
          </Field>
          <Field label="Height">
            <HeightInput value={height} onChange={setHeight} />
          </Field>
          {profile.blind_weight ? (
            <div className="rounded-2xl bg-card-2 px-4 py-3 text-sm">
              <span className="font-semibold">🙈 Starting weight hidden</span>
              <span className="block text-xs text-muted">Blind weigh-ins are on. Manage them on the Progress tab.</span>
            </div>
          ) : (
            <Field label="Starting weight" hint="Only you and staff can see this.">
              <Input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} suffix="lbs" />
            </Field>
          )}
          <Field label="Daily calorie target">
            <Input type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} suffix="cal" />
          </Field>
          <Field label="Daily steps goal">
            <Input type="number" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} suffix="steps" />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" loading={busy}>
            {msg || "Save changes"}
          </Button>
        </Card>
      </form>

      <div className="mt-4">
        <NotificationsCard userId={profile.id} />
      </div>

      <Card className="rise mt-4" style={{ animationDelay: "90ms" }}>
        <Toggle
          checked={sound}
          onChange={(v) => {
            setSound(v);
            setSoundEnabled(v);
            if (v) playTada();
          }}
          label="🔊 Celebration sounds"
        />
        <p className="mt-1 text-xs text-muted">The &quot;ta-da&quot; when you log a workout, meal, or win a prize. Your phone&apos;s silent switch may also mute it.</p>
      </Card>

      <Card className="rise mt-4 text-sm text-muted" style={{ animationDelay: "120ms" }}>
        <p className="font-semibold text-ink">Add to your home screen</p>
        <p className="mt-1">
          <b>iPhone:</b> tap the Share button in Safari, then &quot;Add to Home Screen.&quot;
          <br />
          <b>Android:</b> tap the ⋮ menu in Chrome, then &quot;Add to Home screen.&quot;
        </p>
      </Card>

      <Button
        variant="ghost"
        className="mt-4 w-full"
        onClick={async () => {
          await signOut();
          router.replace("/login");
        }}
      >
        <LogOut className="size-5" /> Log out
      </Button>
    </div>
  );
}
