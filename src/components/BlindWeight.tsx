"use client";

import { useState } from "react";
import { EyeOff, Eye } from "lucide-react";
import { PinInput } from "./PinInput";
import { Button, Card, ErrorText, cn } from "./ui";
import { supabase, type Profile } from "@/lib/supabase";
import { lastChange, revealHash, sinceStart, type Trend } from "@/lib/blind";

export function TrendLine({ t }: { t: Trend | null }) {
  if (!t) return <p className="text-sm text-muted">Your trend shows up after your second weigh-in.</p>;
  return (
    <p className={cn("flex items-center gap-2 font-semibold", t.tone === "good" ? "text-accent" : "text-brand")}>
      <span className="text-xl">{t.emoji}</span> {t.text}
    </p>
  );
}

/**
 * Turn blind weigh-ins on/off, see trends instead of numbers, and reveal numbers with the code.
 * `revealed` is page-only: leaving the page hides the numbers again.
 */
export function BlindWeightCard({
  profile,
  scans,
  revealed,
  onReveal,
  onChanged,
}: {
  profile: Profile;
  scans: { weight: number }[];
  revealed: boolean;
  onReveal: (v: boolean) => void;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<"idle" | "enable" | "reveal" | "disable">("idle");
  const [code, setCode] = useState("");
  const [code2, setCode2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const on = !!profile.blind_weight;

  const reset = () => {
    setMode("idle");
    setCode("");
    setCode2("");
    setError("");
  };

  async function enable() {
    setError("");
    if (code.length !== 4) return setError("Pick a 4-digit reveal code.");
    if (code !== code2) return setError("Those codes don't match.");
    setBusy(true);
    const { error } = await supabase()
      .from("profiles")
      .update({ blind_weight: true, reveal_hash: await revealHash(profile.id, code) })
      .eq("id", profile.id);
    setBusy(false);
    if (error) return setError("Couldn't save. Has 12_blind_weighins.sql been run?");
    reset();
    onReveal(false);
    onChanged();
  }

  async function check(next: "reveal" | "disable") {
    setError("");
    if (!profile.reveal_hash) return setError("No reveal code is set. Ask staff to reveal or turn this off.");
    if ((await revealHash(profile.id, code)) !== profile.reveal_hash) {
      setCode("");
      return setError("That's not the code.");
    }
    if (next === "reveal") {
      onReveal(true);
      reset();
      return;
    }
    setBusy(true);
    await supabase().from("profiles").update({ blind_weight: false, reveal_hash: null }).eq("id", profile.id);
    setBusy(false);
    reset();
    onChanged();
  }

  if (!on || mode === "enable") {
    return mode === "enable" ? (
      <Card className="rise space-y-4">
        <div>
          <h2 className="font-semibold">{on ? "🙈 Set your reveal code" : "🙈 Turn on blind weigh-ins"}</h2>
          <p className="mt-1 text-sm text-muted">
            You&apos;ll only see if you&apos;re up, down, or steady. Never the number. Pick a 4-digit code to reveal the numbers later. You can even have a
            friend or staff member type it so only they know it.
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-muted">Reveal code</p>
          <PinInput value={code} onChange={setCode} autoFocus />
        </div>
        {code.length === 4 && (
          <div className="fade">
            <p className="mb-1.5 text-sm font-medium text-muted">Type it again</p>
            <PinInput value={code2} onChange={setCode2} autoFocus />
          </div>
        )}
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={reset}>
            Cancel
          </Button>
          <Button onClick={enable} loading={busy}>
            {on ? "Save code" : "Hide my weight"}
          </Button>
        </div>
      </Card>
    ) : (
      <button onClick={() => setMode("enable")} className="rise flex w-full items-center gap-3 rounded-2xl bg-card-2 px-4 py-3 text-left text-sm ring-1 ring-line">
        <EyeOff className="size-5 text-muted" />
        <span className="flex-1">
          <b>Rather not see your weight?</b> Turn on blind weigh-ins.
        </span>
      </button>
    );
  }

  return (
    <Card className="rise space-y-3 ring-2 ring-violet/30">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">🙈 Blind weigh-ins {revealed ? <span className="text-sm font-normal text-muted">· numbers showing</span> : "on"}</h2>
        {revealed && (
          <button onClick={() => onReveal(false)} className="flex items-center gap-1 text-sm font-semibold text-violet">
            <EyeOff className="size-4" /> Hide again
          </button>
        )}
      </div>
      {!revealed && (
        <>
          <TrendLine t={sinceStart(scans)} />
          {lastChange(scans) && <TrendLine t={lastChange(scans)} />}
        </>
      )}
      <p className="text-xs text-muted">Have staff weigh you, or hand your phone to someone. The weight box hides what&apos;s typed.</p>

      {mode === "idle" && !revealed && !profile.reveal_hash && (
        <Button className="w-full text-sm" onClick={() => setMode("enable")}>
          Set a reveal code
        </Button>
      )}
      {mode === "idle" && !revealed && !!profile.reveal_hash && (
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1 text-sm" onClick={() => setMode("reveal")}>
            <Eye className="size-4" /> Reveal numbers
          </Button>
          <Button variant="ghost" className="text-sm" onClick={() => setMode("disable")}>
            Turn off
          </Button>
        </div>
      )}
      {(mode === "reveal" || mode === "disable") && (
        <div className="fade space-y-3">
          <p className="text-sm font-medium">{mode === "reveal" ? "Enter your reveal code" : "Enter your reveal code to turn this off"}</p>
          <PinInput value={code} onChange={setCode} autoFocus />
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={reset}>
              Cancel
            </Button>
            <Button onClick={() => check(mode)} loading={busy} disabled={code.length !== 4}>
              {mode === "reveal" ? "Reveal" : "Turn off"}
            </Button>
          </div>
          <p className="text-xs text-muted">Forgot it? Staff can turn blind weigh-ins off for you.</p>
        </div>
      )}
    </Card>
  );
}
