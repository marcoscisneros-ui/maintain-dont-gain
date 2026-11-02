"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AvatarPicker } from "@/components/AvatarPicker";
import { Button, ErrorText, Field, Input, cn } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { todayISO } from "@/lib/dates";

const STEPS = ["photo", "weight", "targets", "inbody"] as const;

export default function SetupPage() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null);
  const [weight, setWeight] = useState(profile?.start_weight?.toString() ?? "");
  const [calories, setCalories] = useState(profile?.calorie_target?.toString() ?? "2000");
  const [steps, setSteps] = useState(profile?.step_goal?.toString() ?? "8000");
  const [bf, setBf] = useState("");
  const [smm, setSmm] = useState("");
  const [waist, setWaist] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!profile) return null;
  const w = Number(weight);

  async function next() {
    setError("");
    if (STEPS[step] === "weight" && !(w > 60 && w < 700)) return setError("Enter your current weight in pounds.");
    if (STEPS[step] === "targets" && !(Number(calories) >= 1000 && Number(calories) <= 6000))
      return setError("Pick a daily calorie target between 1,000 and 6,000.");
    if (step < STEPS.length - 1) return setStep(step + 1);
    await finish();
  }

  async function finish() {
    setBusy(true);
    const sb = supabase();
    const { error } = await sb
      .from("profiles")
      .update({
        avatar_url: avatar,
        start_weight: w,
        calorie_target: Number(calories),
        step_goal: Number(steps) || 8000,
        onboarded: true,
      })
      .eq("id", profile!.id);
    if (error) {
      setBusy(false);
      return setError("Couldn't save. Check your connection and try again.");
    }
    // Starting scan: always record starting weight; InBody numbers if they have them.
    await sb.from("inbody_scans").insert({
      date: todayISO(),
      weight: w,
      body_fat_pct: bf ? Number(bf) : null,
      smm: smm ? Number(smm) : null,
      waist_in: waist ? Number(waist) : null,
    });
    await refreshProfile();
    router.replace("/home");
  }

  return (
    <div className="flex min-h-dvh flex-col pt-6">
      <div className="mb-8 flex items-center gap-3">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          className={cn("-ml-2 rounded-full p-2 text-muted", step === 0 && "invisible")}
          aria-label="Back"
        >
          <ChevronLeft className="size-6" />
        </button>
        <div className="flex flex-1 gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-card-2">
              <div
                className="h-full rounded-full brand-gradient transition-all duration-500"
                style={{ width: i <= step ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>
      </div>

      <div key={step} className="rise flex-1">
        {STEPS[step] === "photo" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Hey {profile.first_name}! 👋</h1>
            <p className="mt-2 text-lg text-muted">Add a profile photo so the crew knows who&apos;s crushing it.</p>
            <div className="mt-10">
              <AvatarPicker
                userId={profile.id}
                name={`${profile.first_name} ${profile.last_name}`}
                url={avatar}
                onChange={setAvatar}
                size={140}
              />
              <p className="mt-4 text-center text-sm text-muted">Optional. You can skip this.</p>
            </div>
          </>
        )}

        {STEPS[step] === "weight" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Where are you starting?</h1>
            <p className="mt-2 text-lg text-muted">
              The goal is simple: be at (or under) this number on January 3rd. Only you and staff can see it.
            </p>
            <div className="mt-8">
              <Field label="Starting weight">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  suffix="lbs"
                  placeholder="185"
                  autoFocus
                />
              </Field>
            </div>
          </>
        )}

        {STEPS[step] === "targets" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Your daily targets</h1>
            <p className="mt-2 text-lg text-muted">We&apos;re maintaining, not dieting. Aim for &quot;steady,&quot; not &quot;starving.&quot;</p>
            <div className="mt-8 space-y-5">
              <Field
                label="Daily calories"
                hint={
                  w > 0 ? (
                    <>
                      Not sure? A typical maintenance range for you is about{" "}
                      <b className="text-ink">
                        {Math.round((w * 13) / 50) * 50}–{Math.round((w * 16) / 50) * 50}
                      </b>{" "}
                      depending on how active you are.
                    </>
                  ) : undefined
                }
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  suffix="cal"
                />
              </Field>
              <Field label="Daily steps goal">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  suffix="steps"
                />
              </Field>
            </div>
          </>
        )}

        {STEPS[step] === "inbody" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Got InBody numbers?</h1>
            <p className="mt-2 text-lg text-muted">
              If you&apos;ve done a scan, add it here as your starting point. Totally optional. You can add scans later.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Field label="Body fat">
                <Input type="number" inputMode="decimal" value={bf} onChange={(e) => setBf(e.target.value)} suffix="%" />
              </Field>
              <Field label="Muscle mass (SMM)">
                <Input type="number" inputMode="decimal" value={smm} onChange={(e) => setSmm(e.target.value)} suffix="lbs" />
              </Field>
              <Field label="Waist">
                <Input type="number" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} suffix="in" />
              </Field>
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 space-y-3 bg-bg pt-4 pb-6">
        <ErrorText>{error}</ErrorText>
        <Button className="w-full" onClick={next} loading={busy}>
          {step === STEPS.length - 1 ? "Start the challenge" : STEPS[step] === "photo" && !avatar ? "Skip for now" : "Next"}
        </Button>
      </div>
    </div>
  );
}
