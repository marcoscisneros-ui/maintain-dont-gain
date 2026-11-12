"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button, Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/dates";
import { timeAgo } from "@/lib/content";
import type { Settings } from "@/lib/settings";
import { finalWeekStart, isUnlocked, type Voucher } from "@/lib/vouchers";

/** One InBody voucher at the front desk: who, which scan, code, and Mark used / Undo. */
export function VoucherRow({ v, name, settings, onChanged, compact }: { v: Voucher; name?: string; settings: Settings; onChanged: () => void; compact?: boolean }) {
  const { profile: me } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const unlocked = isUnlocked(v, settings);

  async function mark(used: boolean) {
    if (used && !unlocked && !confirm(`This is the final-week scan. It unlocks ${formatDate(finalWeekStart(settings))}. Mark it used anyway?`)) return;
    setBusy(true);
    setErr("");
    const { error } = await supabase()
      .from("vouchers")
      .update(used ? { redeemed_at: new Date().toISOString(), redeemed_by: me?.id } : { redeemed_at: null, redeemed_by: null })
      .eq("id", v.id);
    setBusy(false);
    if (error) return setErr(error.message);
    onChanged();
  }

  const label = v.final_week ? "Final InBody scan" : v.slot === 1 ? "Starting InBody scan" : "Check-in InBody scan";
  const Wrapper = compact ? "div" : Card;
  return (
    <Wrapper className={compact ? "rounded-2xl bg-card-2 p-3" : "p-4"}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{unlocked ? "📊" : "🔒"}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {label} <span className="text-xs font-normal text-muted">({v.slot} of 3)</span>
          </p>
          {name && <p className="text-sm">{name}</p>}
          <p className="text-xs text-muted">
            <span className="font-mono font-bold text-ink">{v.code}</span>
            {!unlocked && ` · unlocks ${formatDate(finalWeekStart(settings))}`}
          </p>
        </div>
      </div>
      {v.redeemed_at ? (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-accent">✓ Used {timeAgo(v.redeemed_at)}</span>
          <button onClick={() => mark(false)} className="text-xs text-muted underline" disabled={busy}>
            Undo
          </button>
        </div>
      ) : (
        <Button className="mt-2 min-h-10 w-full text-sm" variant={unlocked ? "primary" : "secondary"} onClick={() => mark(true)} loading={busy}>
          <Check className="size-4" /> Mark used
        </Button>
      )}
      {err && <p className="mt-1 text-xs text-danger">{err}</p>}
    </Wrapper>
  );
}
