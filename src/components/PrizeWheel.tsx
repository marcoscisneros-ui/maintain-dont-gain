"use client";

import { useEffect, useRef, useState } from "react";
import type { Prize, WheelSlice } from "@/lib/rewards";

// Candy colors, one per prize (the same prize is always the same color).
const CANDY = [
  { fill: "#ff3d5a", deep: "#c4122f", text: "#fff" },
  { fill: "#1e90ff", deep: "#0b5cc4", text: "#fff" },
  { fill: "#ffd23f", deep: "#e0a400", text: "#4a2c00" },
  { fill: "#2ecc71", deep: "#14934a", text: "#fff" },
  { fill: "#a259ff", deep: "#6d28d9", text: "#fff" },
  { fill: "#ff9f1a", deep: "#d96a00", text: "#fff" },
  { fill: "#ff5fb0", deep: "#d4237e", text: "#fff" },
  { fill: "#00c2a8", deep: "#00897a", text: "#fff" },
];

const C = 170; // center of the 340×340 drawing
const R = 148; // slice radius

const pt = (deg: number, r: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)] as const;
};

/** Current rotation of an element in degrees (reads the live CSS transform mid-animation). */
function liveAngle(el: Element): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = new DOMMatrixReadOnly(t);
  return (Math.atan2(m.b, m.a) * 180) / Math.PI;
}

/**
 * Glossy game-show prize wheel. Slice sizes are the real odds.
 * `rotation` is controlled by the parent; the pointer "ticks" as pegs pass it.
 */
export function PrizeWheel({
  slices,
  rotation,
  spinning,
  canSpin,
  onSpin,
  winner,
}: {
  slices: WheelSlice[];
  rotation: number;
  spinning: boolean;
  canSpin: boolean;
  onSpin: () => void;
  winner: number | null; // slice index to highlight after landing
}) {
  const wheelRef = useRef<SVGGElement>(null);
  const [tick, setTick] = useState(0);

  // Pointer ticks each time a slice boundary passes under it.
  useEffect(() => {
    if (!spinning || !wheelRef.current || !slices.length) return;
    const bounds = slices.map((s) => s.a0);
    let raf = 0;
    let last = -1;
    const loop = () => {
      const a = (((-liveAngle(wheelRef.current!) % 360) + 360) % 360); // which angle sits under the pointer
      let idx = bounds.findIndex((b, i) => a >= b && a < (bounds[i + 1] ?? 360));
      if (idx < 0) idx = 0;
      if (idx !== last) {
        last = idx;
        setTick((t) => t + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [spinning, slices]);

  const colorOf = new Map<number, (typeof CANDY)[number]>();
  for (const s of slices) if (!colorOf.has(s.prize.id)) colorOf.set(s.prize.id, CANDY[colorOf.size % CANDY.length]);

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none">
      {/* floor shadow */}
      <div aria-hidden className="absolute inset-x-8 -bottom-3 h-8 rounded-[50%] bg-black/25 blur-xl" />

      <div className="relative" style={{ transform: "perspective(1100px) rotateX(10deg)", transformOrigin: "50% 60%" }}>
        <svg viewBox="0 0 340 340" className="h-auto w-full overflow-visible" role="img" aria-label={`Prize wheel with ${new Set(slices.map((s) => s.prize.name)).size} prizes`}>
          <defs>
            <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff4b8" />
              <stop offset="0.25" stopColor="#f7c531" />
              <stop offset="0.5" stopColor="#b9800a" />
              <stop offset="0.75" stopColor="#f6c12a" />
              <stop offset="1" stopColor="#fff0a0" />
            </linearGradient>
            <radialGradient id="rimShade" cx="50%" cy="50%" r="50%">
              <stop offset="0.86" stopColor="#000" stopOpacity="0.35" />
              <stop offset="0.93" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            {CANDY.map((c, i) => (
              <radialGradient key={i} id={`slice${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0.15" stopColor={c.fill} stopOpacity="0.85" />
                <stop offset="0.75" stopColor={c.fill} />
                <stop offset="1" stopColor={c.deep} />
              </radialGradient>
            ))}
            <radialGradient id="hub" cx="40%" cy="35%" r="70%">
              <stop offset="0" stopColor="#ff7a8a" />
              <stop offset="0.55" stopColor="#e11d3f" />
              <stop offset="1" stopColor="#8f0a24" />
            </radialGradient>
            <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* rim */}
          <circle cx={C} cy={C} r="166" fill="url(#rim)" filter="url(#softShadow)" />
          <circle cx={C} cy={C} r="166" fill="url(#rimShade)" />
          <circle cx={C} cy={C} r={R + 3} fill="#7a4a00" />

          {/* rotating part */}
          <g
            ref={wheelRef}
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${C}px ${C}px`,
              transition: spinning ? "transform 5.2s cubic-bezier(0.12, 0.62, 0.08, 1)" : "none",
            }}
          >
            {slices.map((s) => {
              const col = colorOf.get(s.prize.id)!;
              const ci = CANDY.indexOf(col);
              const [x0, y0] = pt(s.a0, R);
              const [x1, y1] = pt(s.a1, R);
              const large = s.a1 - s.a0 > 180 ? 1 : 0;
              const d = slices.length === 1 ? undefined : `M${C} ${C} L${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
              return d ? (
                <path key={s.index} d={d} fill={`url(#slice${ci})`} stroke="#ffe8a3" strokeWidth="1.5" />
              ) : (
                <circle key={s.index} cx={C} cy={C} r={R} fill={`url(#slice${ci})`} />
              );
            })}

            {/* winner glow */}
            {winner != null && slices[winner] && slices.length > 1 && (
              <path
                className="win-glow"
                d={(() => {
                  const s = slices[winner];
                  const [x0, y0] = pt(s.a0, R);
                  const [x1, y1] = pt(s.a1, R);
                  return `M${C} ${C} L${x0} ${y0} A${R} ${R} 0 ${s.a1 - s.a0 > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
                })()}
                fill="#fff"
                fillOpacity="0.25"
                stroke="#fff"
                strokeWidth="4"
              />
            )}

            {/* labels: emoji near the rim, name toward the hub */}
            {slices.map((s) => {
              const col = colorOf.get(s.prize.id)!;
              const flip = s.mid > 180;
              const label = (s.prize.short_name || s.prize.name).slice(0, 13);
              const sweep = s.a1 - s.a0;
              const fs = sweep < 14 ? 9 : label.length > 10 ? 9.5 : 10.5;
              return (
                <g key={"l" + s.index} transform={`rotate(${s.mid} ${C} ${C})`}>
                  <text x={C} y={C - R + 22} textAnchor="middle" dominantBaseline="middle" fontSize={sweep < 14 ? 15 : 20}>
                    {s.prize.emoji || "🎁"}
                  </text>
                  <text
                    x={C}
                    y={C - 74}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${flip ? 90 : -90} ${C} ${C - 74})`}
                    fill={col.text}
                    fontSize={fs}
                    fontWeight="800"
                    style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.01em" }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* pegs on the slice boundaries */}
            {slices.map((s) => {
              const [x, y] = pt(s.a0, R - 4);
              return <circle key={"p" + s.index} cx={x} cy={y} r="3.2" fill="#fff6d0" stroke="#a87400" strokeWidth="1" />;
            })}
          </g>

          {/* light bulbs on the rim (don't rotate) */}
          {Array.from({ length: 28 }, (_, i) => {
            const [x, y] = pt(i * (360 / 28), 157);
            return (
              <circle
                key={"b" + i}
                cx={x}
                cy={y}
                r="4"
                className={`bulb ${i % 2 ? "bulb-b" : "bulb-a"} ${spinning ? "bulb-fast" : ""}`}
              />
            );
          })}

          {/* glossy shine (fixed, so it looks like light on glass) */}
          <path d={`M${C - 120} ${C - 40} Q ${C} ${C - 185} ${C + 120} ${C - 40} Q ${C} ${C - 95} ${C - 120} ${C - 40} Z`} fill="url(#gloss)" opacity="0.7" />
        </svg>

        {/* pointer */}
        <div
          aria-hidden
          className="absolute top-[-14px] left-1/2 z-10 w-[46px] -translate-x-1/2"
          style={{ transformOrigin: "50% 12px" }}
        >
          <svg
            key={tick}
            viewBox="0 0 46 60"
            className={spinning ? "pointer-tick" : ""}
            style={{ transformOrigin: "23px 12px", filter: "drop-shadow(0 3px 3px rgb(0 0 0 / 0.35))" }}
          >
            <defs>
              <linearGradient id="ptrGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff4b8" />
                <stop offset="0.5" stopColor="#f2b51e" />
                <stop offset="1" stopColor="#a86f00" />
              </linearGradient>
            </defs>
            <path d="M23 58 L5 16 A18 18 0 1 1 41 16 Z" fill="url(#ptrGold)" stroke="#8a5a00" strokeWidth="1.5" />
            <circle cx="23" cy="14" r="7" fill="#e11d3f" stroke="#fff" strokeWidth="2" />
            <circle cx="21" cy="12" r="2" fill="#fff" opacity="0.8" />
          </svg>
        </div>

        {/* SPIN hub button */}
        <button
          type="button"
          onClick={onSpin}
          disabled={!canSpin || spinning}
          aria-label={canSpin ? "Spin the wheel" : "No spins available"}
          className={`absolute top-1/2 left-1/2 z-10 flex size-[74px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition active:scale-95 ${canSpin && !spinning ? "hub-pulse" : ""}`}
        >
          <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full" aria-hidden>
            <circle cx="40" cy="40" r="39" fill="url(#rim)" />
            <circle cx="40" cy="40" r="32" fill={canSpin ? "url(#hub)" : "#8b8f8d"} />
            <ellipse cx="34" cy="26" rx="18" ry="9" fill="#fff" opacity="0.35" />
          </svg>
          <span className="relative text-[17px] font-black tracking-wide text-white [text-shadow:0_2px_2px_rgb(0_0_0/0.35)]">
            {canSpin ? "SPIN" : "🔒"}
          </span>
        </button>
      </div>
    </div>
  );
}

/** Rotation that lands the pointer in the middle-ish of one of this prize's slices. */
export function rotationFor(slices: WheelSlice[], prizeId: number, current: number): { rotation: number; index: number } {
  const options = slices.filter((s) => s.prize.id === prizeId);
  const s = options[Math.floor(Math.random() * options.length)] ?? slices[0];
  const sweep = s.a1 - s.a0;
  const jitter = (Math.random() - 0.5) * sweep * 0.55;
  const target = 360 - (s.mid + jitter);
  const base = current - (current % 360);
  return { rotation: base + 360 * 7 + target, index: s.index };
}

/** A quick burst of confetti from the middle of the screen. */
export function Confetti() {
  const colors = ["#ff3d5a", "#ffd23f", "#2ecc71", "#1e90ff", "#a259ff", "#ff9f1a", "#ff5fb0"];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {Array.from({ length: 70 }, (_, i) => {
        const angle = (i / 70) * Math.PI * 2 + (i % 7) * 0.3;
        const dist = 140 + ((i * 37) % 160);
        const style = {
          "--dx": `${Math.cos(angle) * dist}px`,
          "--dy": `${Math.sin(angle) * dist - 120}px`,
          "--rot": `${((i * 53) % 720) - 360}deg`,
          background: colors[i % colors.length],
          animationDelay: `${(i % 10) * 18}ms`,
          width: i % 3 ? 8 : 6,
          height: i % 3 ? 12 : 6,
          borderRadius: i % 4 === 0 ? 999 : 2,
        } as React.CSSProperties;
        return <span key={i} className="confetti" style={style} />;
      })}
    </div>
  );
}

export type { Prize };
