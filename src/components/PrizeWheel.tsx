"use client";

import type { Prize } from "@/lib/rewards";

const COLORS = ["var(--brand)", "var(--gold)", "var(--accent)", "var(--violet)", "var(--brand-2)", "#8a5a44"];

/** Slices are sized by each prize's real odds. `rotation` is controlled by the parent. */
export function PrizeWheel({ prizes, rotation, spinning }: { prizes: Prize[]; rotation: number; spinning: boolean }) {
  const pool = prizes.filter((p) => p.active && p.weight > 0);
  const total = pool.reduce((s, p) => s + p.weight, 0) || 1;
  const R = 150;
  const slices = pool.map((p, i) => {
    const a0 = (pool.slice(0, i).reduce((sum, q) => sum + q.weight, 0) / total) * 360;
    const sweep = (p.weight / total) * 360;
    return { p, a0, a1: a0 + sweep, mid: a0 + sweep / 2, color: COLORS[i % COLORS.length] };
  });
  const pt = (deg: number, r = R) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [160 + r * Math.cos(rad), 160 + r * Math.sin(rad)];
  };

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]">
      {/* pointer */}
      <div className="absolute top-[-6px] left-1/2 z-10 -translate-x-1/2 drop-shadow-md">
        <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden>
          <path d="M17 40 L2 8 Q17 -6 32 8 Z" fill="var(--ink)" />
          <circle cx="17" cy="12" r="5" fill="var(--gold)" />
        </svg>
      </div>
      <svg
        viewBox="0 0 320 320"
        className="h-full w-full drop-shadow-xl"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "transform 4.8s cubic-bezier(0.15, 0.7, 0.1, 1)" : "none",
        }}
        role="img"
        aria-label={`Prize wheel: ${pool.map((p) => p.name).join(", ")}`}
      >
        <circle cx="160" cy="160" r="158" fill="var(--card)" stroke="var(--gold)" strokeWidth="4" />
        {slices.length === 1 ? (
          <circle cx="160" cy="160" r={R} fill={slices[0].color} />
        ) : (
          slices.map(({ p, a0, a1, color }) => {
            const [x0, y0] = pt(a0);
            const [x1, y1] = pt(a1);
            const large = a1 - a0 > 180 ? 1 : 0;
            return <path key={p.id} d={`M160 160 L${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`} fill={color} stroke="var(--card)" strokeWidth="2" />;
          })
        )}
        {slices.map(({ p, mid, a0, a1 }) => {
          // Name runs from near the hub out toward the rim, centered in its slice.
          const max = a1 - a0 < 30 ? 12 : 17;
          const label = p.name.length > max ? p.name.slice(0, max - 1).trimEnd() + "…" : p.name;
          return (
            <text
              key={"t" + p.id}
              // left half of the wheel: flip so the name isn't upside down
              x={mid > 180 ? 124 : 196}
              y="160"
              textAnchor={mid > 180 ? "end" : "start"}
              dominantBaseline="middle"
              transform={`rotate(${mid > 180 ? mid + 90 : mid - 90} 160 160)`}
              fill="#fff"
              fontSize="11.5"
              fontWeight="700"
              style={{ fontFamily: "var(--font-sans)", paintOrder: "stroke", stroke: "rgb(0 0 0 / 0.18)", strokeWidth: 2 }}
            >
              {label}
            </text>
          );
        })}
        {/* lights around the rim */}
        {Array.from({ length: 24 }, (_, i) => {
          const [x, y] = pt(i * 15, 154);
          return <circle key={i} cx={x} cy={y} r="2.6" fill={i % 2 ? "#fff6d6" : "var(--gold)"} />;
        })}
        <circle cx="160" cy="160" r="26" fill="var(--card)" stroke="var(--gold)" strokeWidth="4" />
        <text x="160" y="167" textAnchor="middle" fontSize="20">🎁</text>
      </svg>
    </div>
  );
}

/** Rotation that lands the wheel on this prize's slice (with a little natural wobble). */
export function rotationFor(prizes: Prize[], prizeId: number, current: number): number {
  const pool = prizes.filter((p) => p.active && p.weight > 0);
  const total = pool.reduce((s, p) => s + p.weight, 0) || 1;
  let a = 0;
  for (const p of pool) {
    const sweep = (p.weight / total) * 360;
    if (p.id === prizeId) {
      const jitter = (Math.random() - 0.5) * sweep * 0.6;
      const target = 360 - (a + sweep / 2 + jitter); // bring the slice's middle to the top pointer
      const base = current - (current % 360);
      return base + 360 * 6 + target;
    }
    a += sweep;
  }
  return current + 360 * 6;
}
