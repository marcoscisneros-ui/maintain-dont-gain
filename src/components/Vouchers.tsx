"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Sheet } from "./Sheet";
import { cn } from "./ui";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/dates";
import type { Settings } from "@/lib/settings";
import { finalWeekStart, isUnlocked, type Voucher } from "@/lib/vouchers";

/** A member's free InBody scan vouchers, ticket style. Tap one to show the code at the front desk. */
export function InBodyVouchers({ userId, settings, name }: { userId: string; settings: Settings; name: string }) {
  const [vouchers, setVouchers] = useState<Voucher[] | null>(null);
  const [open, setOpen] = useState<Voucher | null>(null);

  useEffect(() => {
    supabase()
      .from("vouchers")
      .select("*")
      .eq("user_id", userId)
      .eq("kind", "inbody")
      .order("slot")
      .then(({ data, error }) => setVouchers(error ? [] : ((data ?? []) as Voucher[])));
  }, [userId]);

  if (!vouchers || vouchers.length === 0) return null;
  const ready = vouchers.filter((v) => !v.redeemed_at && isUnlocked(v, settings)).length;
  const unlockDay = formatDate(finalWeekStart(settings), { weekday: "short", month: "short", day: "numeric" });

  return (
    <section className="rise">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-semibold">Free InBody scans</h2>
        <span className="text-sm font-semibold text-accent">{ready} ready to use</span>
      </div>
      <div className="space-y-2">
        {vouchers.map((v) => {
          const unlocked = isUnlocked(v, settings);
          const used = !!v.redeemed_at;
          return (
            <button
              key={v.id}
              disabled={!unlocked || used}
              onClick={() => setOpen(v)}
              className={cn(
                "relative flex w-full items-stretch overflow-hidden rounded-2xl text-left shadow-card ring-1 transition active:scale-[0.99]",
                used ? "bg-card-2 ring-line opacity-60" : unlocked ? "bg-card ring-accent/40" : "bg-card-2 ring-line",
              )}
            >
              {/* ticket stub */}
              <span
                className={cn(
                  "flex w-20 shrink-0 flex-col items-center justify-center border-r-2 border-dashed text-white",
                  used ? "border-line bg-muted/40" : unlocked ? "border-white/60 bg-gradient-to-b from-[#1f8a5b] to-[#14663f]" : "border-line bg-muted/50",
                )}
              >
                <span className="text-2xl">{unlocked ? "📊" : "🔒"}</span>
                <span className="text-[10px] font-bold tracking-wider uppercase">Scan {v.slot}</span>
              </span>
              <span className="flex-1 px-4 py-3">
                <span className="block font-semibold">{v.final_week ? "Final InBody scan" : v.slot === 1 ? "Starting InBody scan" : "Check-in InBody scan"}</span>
                {used ? (
                  <span className="block text-sm text-muted">✓ Used {formatDate(v.redeemed_at!.slice(0, 10))}</span>
                ) : unlocked ? (
                  <span className="block text-sm text-muted">
                    Tap to show code · <span className="font-mono font-bold text-ink">{v.code}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <Lock className="size-3" /> Unlocks {unlockDay} (final week)
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">Show the code at the front desk to book your free scan. Staff will mark it used.</p>

      {open && (
        <Sheet title="Free InBody scan" onClose={() => setOpen(null)}>
          <div className="rounded-3xl bg-gradient-to-br from-[#1f8a5b] to-[#14663f] p-1.5 text-white">
            <div className="rounded-[20px] border-2 border-dashed border-white/50 px-5 py-8 text-center">
              <p className="text-xs font-bold tracking-[0.25em] uppercase opacity-85">Maintain, Don&apos;t Gain</p>
              <p className="mt-2 text-2xl font-black">Free InBody Scan</p>
              <p className="mt-1 text-sm opacity-90">
                {name} · voucher {open.slot} of 3
              </p>
              <p className="mt-6 rounded-2xl bg-white px-4 py-4 font-mono text-4xl font-bold tracking-[0.15em] text-[#14663f]">{open.code}</p>
              <p className="mt-5 text-sm font-semibold">Show this at the front desk.</p>
            </div>
          </div>
        </Sheet>
      )}
    </section>
  );
}
