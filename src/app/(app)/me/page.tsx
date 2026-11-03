"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { AvatarPicker } from "@/components/AvatarPicker";
import { Button, Card, ErrorText, Field, Input, PageHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function MePage() {
  const router = useRouter();
  const { profile, refreshProfile, signOut } = useAuth();
  const [weight, setWeight] = useState(profile?.start_weight?.toString() ?? "");
  const [calories, setCalories] = useState(profile?.calorie_target?.toString() ?? "");
  const [steps, setSteps] = useState(profile?.step_goal?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
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
    setBusy(true);
    const { error } = await supabase()
      .from("profiles")
      .update({
        start_weight: weight ? Number(weight) : null,
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
          <Field label="Starting weight" hint="Only you and staff can see this.">
            <Input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} suffix="lbs" />
          </Field>
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
