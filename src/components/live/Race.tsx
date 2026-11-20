"use client";

// The Holiday Race: every member is a racer in their own lane, moving toward the finish line
// as they earn points. Turkeys run the "Turkey Trot" in November; from December 1 it becomes
// a "Reindeer Race" with reindeer pulling sleighs.

import { useEffect, useState, type CSSProperties } from "react";
import { Avatar } from "@/components/Avatar";
import { Turkey } from "./LiveArt";
import type { Row } from "@/lib/leaderboard";

/** A galloping reindeer (facing right) pulling a little gift sleigh. */
export function ReindeerSleigh({ width = 200, delay = 0 }: { width?: number; delay?: number }) {
  return (
    <svg width={width} height={width * 0.58} viewBox="0 0 260 150" aria-hidden className="lv-deer overflow-visible" style={{ "--d": `${delay}s` } as CSSProperties}>
      <defs>
        <radialGradient id="deer-body" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#c48a5a" />
          <stop offset="0.6" stopColor="#8a5530" />
          <stop offset="1" stopColor="#55311a" />
        </radialGradient>
        <linearGradient id="sleigh-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6b7d" />
          <stop offset="0.5" stopColor="#d61f3c" />
          <stop offset="1" stopColor="#7d0d22" />
        </linearGradient>
        <linearGradient id="runner-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset="0.5" stopColor="#f2b72f" />
          <stop offset="1" stopColor="#a86c00" />
        </linearGradient>
        <radialGradient id="nose-glow">
          <stop offset="0" stopColor="#ff5a5a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff5a5a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="130" cy="142" rx="118" ry="6" fill="#000" opacity="0.22" />

      {/* sleigh (bobs a little behind the reindeer) */}
      <g className="lv-sleigh">
        <path d="M14 128 C4 128 2 116 12 116 L96 116 C106 116 110 108 106 100" stroke="url(#runner-gold)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M26 116 L30 106 M78 116 L74 106" stroke="#a86c00" strokeWidth="4" strokeLinecap="round" />
        {/* gifts */}
        <rect x="30" y="58" width="24" height="22" rx="3" fill="#1f8a5b" />
        <rect x="40" y="58" width="5" height="22" fill="#ffd23f" />
        <rect x="52" y="50" width="22" height="30" rx="3" fill="#3f74c9" />
        <rect x="61" y="50" width="5" height="30" fill="#fff" />
        <path d="M63 50 c-6 -8 -12 -4 -6 1 M63 50 c6 -8 12 -4 6 1" stroke="#fff" strokeWidth="3" fill="none" />
        <path d="M18 76 C14 100 24 108 40 108 L84 108 C98 108 104 96 104 84 L104 74 C96 80 86 80 80 76 L30 76 C24 76 20 72 18 64 Z" fill="url(#sleigh-red)" stroke="#5a0816" strokeWidth="2" />
        <path d="M22 70 C18 62 22 56 28 58" stroke="url(#runner-gold)" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M30 92 L92 92" stroke="#ffd23f" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" />
        <ellipse cx="44" cy="84" rx="16" ry="4" fill="#fff" opacity="0.35" />
      </g>

      {/* reins */}
      <path d="M102 80 Q130 96 156 82" stroke="#5a0816" strokeWidth="3" fill="none" />

      {/* reindeer */}
      <g className="lv-deer-body">
        {/* back legs */}
        <g className="lv-deer-leg lv-deer-back">
          <path d="M146 88 L140 118 L136 132" stroke="#55311a" strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M136 132 l-6 2" stroke="#2a1608" strokeWidth="7" strokeLinecap="round" />
        </g>
        <g className="lv-deer-leg lv-deer-front">
          <path d="M196 90 L204 116 L210 130" stroke="#55311a" strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M210 130 l6 1" stroke="#2a1608" strokeWidth="7" strokeLinecap="round" />
        </g>
        {/* tail */}
        <ellipse cx="132" cy="70" rx="8" ry="6" fill="#f6efe4" />
        {/* body */}
        <ellipse cx="172" cy="80" rx="42" ry="22" fill="url(#deer-body)" />
        <ellipse cx="176" cy="92" rx="28" ry="8" fill="#e8c9a3" opacity="0.7" />
        <ellipse cx="160" cy="70" rx="16" ry="6" fill="#fff" opacity="0.25" />
        {/* near legs */}
        <g className="lv-deer-leg lv-deer-back2">
          <path d="M156 92 L152 120 L150 134" stroke="#6b3e20" strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M150 134 l-6 1" stroke="#2a1608" strokeWidth="7" strokeLinecap="round" />
        </g>
        <g className="lv-deer-leg lv-deer-front2">
          <path d="M186 94 L190 120 L194 134" stroke="#6b3e20" strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M194 134 l6 1" stroke="#2a1608" strokeWidth="7" strokeLinecap="round" />
        </g>
        {/* harness + bell */}
        <path d="M198 66 C204 80 204 92 198 100" stroke="#c8283f" strokeWidth="7" fill="none" />
        <circle cx="204" cy="94" r="5.5" fill="url(#runner-gold)" stroke="#a86c00" strokeWidth="1" className="lv-deer-bell" />
        {/* neck + head */}
        <g className="lv-deer-head">
          <path d="M196 72 C200 56 208 44 218 38 L228 48 C220 56 214 66 210 80 Z" fill="url(#deer-body)" />
          {/* antlers */}
          <path d="M220 30 C216 18 208 12 200 10 M212 16 C210 8 212 2 216 0 M206 13 C200 12 196 6 196 2" stroke="#d9b37a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M228 30 C232 18 240 12 248 12 M238 16 C238 8 236 4 232 0 M244 13 C250 10 252 6 252 2" stroke="#e8c58a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="232" cy="40" rx="18" ry="12" fill="url(#deer-body)" transform="rotate(12 232 40)" />
          <path d="M216 32 C210 24 206 26 208 32 C210 36 214 36 216 34Z" fill="#8a5530" />
          <circle cx="234" cy="35" r="3.4" fill="#1d1a17" />
          <circle cx="235.2" cy="34" r="1.1" fill="#fff" />
          <circle cx="250" cy="45" r="13" fill="url(#nose-glow)" className="lv-deer-glow" />
          <circle cx="250" cy="45" r="6" fill="#e0263f" />
          <circle cx="248" cy="43" r="2" fill="#fff" opacity="0.8" />
          <path d="M238 50 Q242 53 246 51" stroke="#2a1608" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

type Props = {
  rows: Row[];
  winter: boolean;
  /** how many lanes to show (the viewer's own lane is always added if they're further back) */
  lanes?: number;
  meId?: string;
  /** racer size in px */
  racer?: number;
  /** "tv" uses the big dark dashboard look; "card" fits inside the app */
  variant?: "tv" | "card";
};

/** Lanes of racers. Each racer's distance = their points compared with the leader's. */
export function RaceTrack({ rows, winter, lanes = 8, meId, racer = 64, variant = "card" }: Props) {
  // racers start at the line, then dash to their spot (and glide forward whenever points go up)
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 350);
    return () => clearTimeout(t);
  }, []);

  const ranked = rows.map((r, i) => ({ r, place: i + 1 }));
  let shown = ranked.slice(0, lanes);
  const mine = meId ? ranked.find((x) => x.r.user_id === meId) : undefined;
  if (mine && !shown.includes(mine)) shown = [...shown.slice(0, lanes - 1), mine];
  const lead = Math.max(1, rows[0]?.points ?? 1);
  const tv = variant === "tv";

  return (
    <div className={`relative flex flex-col ${tv ? "gap-[0.35rem]" : "gap-1.5"}`}>
      {shown.map(({ r, place }, i) => {
        const pct = go ? Math.min(1, r.points / lead) : 0;
        const me = r.user_id === meId;
        return (
          <div
            key={r.user_id}
            className={`relative flex items-center overflow-visible ${tv ? "gap-[0.8rem]" : "gap-2"}`}
            style={{ height: racer * (tv ? 0.56 : 0.8) + (tv ? 6 : 4) }}
          >
            {/* who */}
            <div className={`flex shrink-0 items-center ${tv ? "w-[13.5rem] gap-[0.6rem]" : "w-[5.6rem] gap-1.5"}`}>
              <span
                className={`flex shrink-0 items-center justify-center rounded-full font-black ${tv ? "size-[2rem] text-[1rem]" : "size-6 text-xs"} ${
                  place === 1 ? "bg-[#ffd23f] text-[#4a2c00]" : place === 2 ? "bg-[#d7dee5] text-[#3a434c]" : place === 3 ? "bg-[#d98a4a] text-[#3b1a08]" : tv ? "bg-white/15 text-white" : "bg-card-2 text-muted"
                }`}
              >
                {place}
              </span>
              {tv && <Avatar url={r.avatar_url} name={`${r.first_name} ${r.last_initial}`} size={Math.round(racer * 0.55)} className="ring-white/40" />}
              <span className="min-w-0">
                <span className={`block truncate font-bold ${tv ? "text-[1.2rem]" : "text-xs"} ${me ? "text-brand" : ""}`}>
                  {r.first_name} {r.last_initial}.
                </span>
                <span className={`block font-semibold ${tv ? "text-[0.95rem] text-[#ffd23f]" : "text-[11px] text-muted"}`}>{r.points} pts</span>
              </span>
            </div>

            {/* the lane */}
            <div
              className={`lv-lane relative h-full flex-1 rounded-full ${winter ? "lv-lane-snow" : "lv-lane-dirt"} ${me ? "ring-2 ring-brand" : ""}`}
              style={{ "--i": i } as CSSProperties}
            >
              <span aria-hidden className="lv-finish absolute inset-y-0 right-0 w-[6%] min-w-3 rounded-r-full" />
              {/* racer: the left edge tracks the distance, shifted back by its own width so the leader stops at the flag */}
              <div
                className="lv-racer absolute bottom-[8%]"
                style={{ left: `calc(${pct * 94}% - ${pct * racer * (winter ? 1.55 : 0.95)}px)`, transitionDelay: `${i * 120}ms` }}
              >
                <span aria-hidden className="lv-dust" />
                <span aria-hidden className="lv-dust" style={{ animationDelay: "0.25s" }} />
                {winter ? <ReindeerSleigh width={racer * 1.55} delay={i * 0.11} /> : <Turkey size={racer} pose="walk" delay={i * 0.13} />}
                {place === 1 && r.points > 0 && <span className={`absolute left-1/2 -translate-x-1/2 ${tv ? "-top-[1.1rem] text-[1.4rem]" : "-top-3 text-sm"}`}>👑</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
