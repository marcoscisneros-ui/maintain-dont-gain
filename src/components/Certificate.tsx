import { formatDate } from "@/lib/dates";
import type { Spin } from "@/lib/rewards";
import { JingleBells } from "./Seasonal";

/** The prize certificate a member shows at the front desk. */
export function Certificate({ spin, name, emoji = "🎁" }: { spin: Spin; name: string; emoji?: string }) {
  const redeemed = !!spin.redeemed_at;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#fffaf0] p-1.5 text-[#2a2118] shadow-card">
      <div className="rounded-[20px] border-2 border-[#d9a21b] p-1">
        <div className="relative rounded-2xl border border-[#d9a21b]/60 px-5 py-6 text-center">
          <JingleBells size={44} className="absolute top-3 right-3" />
          <p className="text-[11px] font-bold tracking-[0.25em] text-[#c8283f] uppercase">Maintain, Don&apos;t Gain</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">Prize Certificate</p>
          <p className="mt-4 text-sm text-[#74695e]">Awarded to</p>
          <p className="text-xl font-bold">{name}</p>
          <p className="mt-4 text-sm text-[#74695e]">for 4+ workout days the week of {formatDate(spin.week_start, { month: "long", day: "numeric" })}</p>
          <p className="mt-3 rounded-2xl bg-[#c8283f]/8 px-4 py-3 text-lg leading-snug font-bold text-[#c8283f]">{emoji} {spin.prize_name}</p>
          <p className="mt-4 font-mono text-3xl font-bold tracking-[0.15em]">{spin.code}</p>
          <p className="mt-3 text-sm font-semibold">
            {redeemed ? (
              <span className="rounded-full bg-[#1f8a5b]/12 px-3 py-1 text-[#1f8a5b]">
                ✓ Redeemed {formatDate(spin.redeemed_at!.slice(0, 10))}
              </span>
            ) : (
              <span className="text-[#74695e]">Show this at the front desk to claim your prize.</span>
            )}
          </p>
        </div>
      </div>
      {redeemed && (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-18deg] rounded-xl border-4 border-[#1f8a5b]/50 px-4 py-1 text-3xl font-black tracking-widest text-[#1f8a5b]/50">REDEEMED</span>
        </div>
      )}
    </div>
  );
}
