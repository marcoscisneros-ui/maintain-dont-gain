"use client";

import { useEffect, useState } from "react";
import { todayISO } from "@/lib/dates";

export type Season = "fall" | "winter";

/** Leaves through November, snow from December 1 on. */
export function seasonFor(dateISO: string = todayISO()): Season {
  const m = Number(dateISO.slice(5, 7));
  return m === 12 || m <= 2 ? "winter" : "fall";
}

/** Season decided on the phone (not at build time), so it flips on Dec 1 by itself. */
export function useSeason(): Season | null {
  const [season, setSeason] = useState<Season | null>(null);
  useEffect(() => setSeason(seasonFor()), []);
  return season;
}

// deterministic "random" so server and browser render the same thing
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Gently falling leaves (fall) or snow (winter). Decorative only: hidden from screen
 * readers and turned off for people who prefer reduced motion.
 */
export function SeasonalFall({
  season: forced,
  count = 14,
  tone = "light",
}: {
  season?: Season;
  count?: number;
  /** "light" = white snow for colored backgrounds; "page" = tinted for the page background */
  tone?: "light" | "page";
}) {
  const auto = useSeason();
  const season = forced ?? auto;
  if (!season) return null;
  const glyphs = season === "fall" ? ["🍂", "🍁", "🍂"] : ["❄", "❅", "❆", "•"];
  return (
    <div aria-hidden className="flake-layer pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const g = glyphs[i % glyphs.length];
        const size = season === "fall" ? 12 + rand(i, 1) * 10 : g === "•" ? 5 + rand(i, 1) * 4 : 9 + rand(i, 1) * 9;
        const style = {
          left: `${rand(i, 2) * 96}%`,
          "--dur": `${(season === "fall" ? 9 : 7) + rand(i, 3) * 7}s`,
          "--delay": `${-rand(i, 4) * 14}s`,
          "--drift": `${(rand(i, 5) - 0.3) * 60}px`,
          "--spin": season === "fall" ? `${(rand(i, 6) - 0.5) * 540}deg` : `${rand(i, 6) * 180}deg`,
          "--o": season === "fall" ? 0.85 : 0.55 + rand(i, 7) * 0.4,
        } as React.CSSProperties;
        return (
          <span key={i} className="flake-track" style={style}>
            <span
              className="flake"
              style={{
                fontSize: size,
                color: season === "winter" ? (tone === "light" ? "#fff" : "var(--violet)") : undefined,
              }}
            >
              {g}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** A pair of gold jingle bells with a cranberry bow. */
export function JingleBells({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={`jingle ${className}`}>
      <defs>
        <linearGradient id="bell-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="0.55" stopColor="#f2b72f" />
          <stop offset="1" stopColor="#c7860c" />
        </linearGradient>
      </defs>
      {/* ribbon */}
      <path d="M32 6 L22 26" stroke="#7a1022" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 6 L42 26" stroke="#7a1022" strokeWidth="2.5" strokeLinecap="round" />
      {/* left bell */}
      <g transform="rotate(-14 22 34)">
        <path d="M22 22c-6 0-9.5 4.6-9.5 10.8v5.2l-3 4h25l-3-4v-5.2C31.5 26.6 28 22 22 22z" fill="url(#bell-gold)" stroke="#a86e08" strokeWidth="1" />
        <circle cx="22" cy="44.5" r="3" fill="#a86e08" />
        <path d="M16.5 30c1-3 3-4.5 5.5-4.8" stroke="#fff6d6" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8" />
      </g>
      {/* right bell */}
      <g transform="rotate(14 42 34)">
        <path d="M42 22c-6 0-9.5 4.6-9.5 10.8v5.2l-3 4h25l-3-4v-5.2C51.5 26.6 48 22 42 22z" fill="url(#bell-gold)" stroke="#a86e08" strokeWidth="1" />
        <circle cx="42" cy="44.5" r="3" fill="#a86e08" />
        <path d="M36.5 30c1-3 3-4.5 5.5-4.8" stroke="#fff6d6" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8" />
      </g>
      {/* bow */}
      <path d="M32 8c-4-6-12-6-11 0 1 4 7 3 11 0z" fill="#d7263d" stroke="#7a1022" strokeWidth="1" />
      <path d="M32 8c4-6 12-6 11 0-1 4-7 3-11 0z" fill="#d7263d" stroke="#7a1022" strokeWidth="1" />
      <circle cx="32" cy="8" r="2.8" fill="#a11a2d" />
    </svg>
  );
}
