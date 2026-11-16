// Artwork for the Live Dashboard: animated glossy turkeys, 3D coins, a 3D podium block,
// twinkling string lights and falling leaves/snow. Pure SVG/CSS, nothing to download.
// These animations intentionally run even with "reduce motion" on: this is a display board.

import type { CSSProperties, ReactNode } from "react";

const FEATHERS = [
  { a: -78, c: "#7a3b1d" },
  { a: -58, c: "#c8283f" },
  { a: -39, c: "#e8762c" },
  { a: -19, c: "#f2b72f" },
  { a: 0, c: "#c8283f" },
  { a: 19, c: "#f2b72f" },
  { a: 39, c: "#e8762c" },
  { a: 58, c: "#c8283f" },
  { a: 78, c: "#7a3b1d" },
];

export type TurkeyPose = "idle" | "walk" | "flex" | "cheer";

/** A cartoon gym turkey: fanning tail, bobbing head, blinking eyes, sweatband. */
export function Turkey({ size = 160, pose = "idle", delay = 0, className = "" }: { size?: number; pose?: TurkeyPose; delay?: number; className?: string }) {
  const style = { "--d": `${delay}s` } as CSSProperties;
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" aria-hidden className={`lv-turkey lv-pose-${pose} ${className}`} style={style}>
      <defs>
        <radialGradient id="tk-body" cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#c97a46" />
          <stop offset="0.5" stopColor="#8a4520" />
          <stop offset="1" stopColor="#4a210c" />
        </radialGradient>
        <radialGradient id="tk-head" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#f3d2a8" />
          <stop offset="1" stopColor="#c78a57" />
        </radialGradient>
        <linearGradient id="tk-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="tk-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a65a2a" />
          <stop offset="1" stopColor="#4f230d" />
        </linearGradient>
        <linearGradient id="tk-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#8b96a3" />
          <stop offset="1" stopColor="#dfe5ea" />
        </linearGradient>
      </defs>

      <ellipse cx="110" cy="206" rx="60" ry="8" fill="#000" opacity="0.28" className="lv-tk-shadow" />

      <g className="lv-tk-bounce">
        {/* tail fan */}
        <g transform="translate(110 138)">
          {FEATHERS.map((f, i) => (
            <g key={i} className="lv-feather" style={{ "--a": `${f.a}deg`, "--fd": `${i * 0.07}s` } as CSSProperties}>
              <path d="M0 0 C-19 -30 -21 -86 0 -108 C21 -86 19 -30 0 0Z" fill={f.c} stroke="#3b1a08" strokeOpacity="0.35" strokeWidth="1.5" />
              <path d="M0 -10 C-8 -36 -9 -78 0 -96" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M-14 -70 Q0 -62 14 -70" stroke="#3b1a08" strokeOpacity="0.35" strokeWidth="3" fill="none" />
              <circle cy="-92" r="6" fill="#ffe08a" opacity="0.9" />
            </g>
          ))}
        </g>

        {/* legs */}
        <g className="lv-leg lv-leg-l">
          <path d="M96 176 L92 200 M92 200 l-9 4 M92 200 l2 6 M92 200 l9 3" stroke="#e8962c" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
        <g className="lv-leg lv-leg-r">
          <path d="M124 176 L128 200 M128 200 l9 4 M128 200 l-2 6 M128 200 l-9 3" stroke="#e8962c" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>

        {/* body */}
        <ellipse cx="110" cy="146" rx="50" ry="44" fill="url(#tk-body)" />
        <path d="M84 132 Q110 120 136 132 M80 148 Q110 136 140 148 M84 164 Q110 152 136 164" stroke="#3b1a08" strokeOpacity="0.3" strokeWidth="3" fill="none" />
        <ellipse cx="92" cy="122" rx="18" ry="11" fill="url(#tk-gloss)" transform="rotate(-25 92 122)" />

        {/* wings (the right one pumps a dumbbell in "flex") */}
        <g className="lv-wing lv-wing-l">
          <path d="M66 132 C48 140 46 166 64 176 C70 166 74 150 72 134Z" fill="url(#tk-wing)" />
        </g>
        <g className="lv-wing lv-wing-r">
          <path d="M154 132 C172 140 174 166 156 176 C150 166 146 150 148 134Z" fill="url(#tk-wing)" />
          {pose === "flex" && (
            <g transform="translate(160 150)">
              <rect x="-4" y="-2" width="30" height="5" rx="2.5" fill="url(#tk-chrome)" />
              <rect x="-10" y="-12" width="8" height="26" rx="3" fill="#c8283f" />
              <rect x="22" y="-12" width="8" height="26" rx="3" fill="#c8283f" />
              <rect x="-8" y="-9" width="2" height="16" rx="1" fill="#fff" opacity="0.6" />
              <rect x="24" y="-9" width="2" height="16" rx="1" fill="#fff" opacity="0.6" />
            </g>
          )}
        </g>

        {/* neck + head */}
        <g className="lv-head">
          <path d="M100 116 C98 100 100 88 104 80 L120 80 C124 88 124 100 120 116Z" fill="url(#tk-head)" />
          <circle cx="112" cy="70" r="22" fill="url(#tk-head)" />
          <ellipse cx="104" cy="60" rx="8" ry="5" fill="#fff" opacity="0.45" transform="rotate(-25 104 60)" />
          {/* sweatband */}
          <path d="M90 58 Q112 46 134 58 L134 66 Q112 54 90 66Z" fill="#c8283f" />
          <path d="M91 61 Q112 50 133 61" stroke="#fff" strokeWidth="2.2" fill="none" opacity="0.9" />
          {/* eyes */}
          <g className="lv-blink">
            <circle cx="104" cy="72" r="6" fill="#fff" />
            <circle cx="121" cy="72" r="6" fill="#fff" />
            <circle cx="105" cy="73" r="3.2" fill="#1d1a17" />
            <circle cx="120" cy="73" r="3.2" fill="#1d1a17" />
            <circle cx="106.2" cy="71.6" r="1.2" fill="#fff" />
            <circle cx="121.2" cy="71.6" r="1.2" fill="#fff" />
          </g>
          {/* beak */}
          <path d="M106 79 L119 79 L112.5 90Z" fill="#f2a12c" stroke="#b86d0c" strokeWidth="1" strokeLinejoin="round" />
          {/* wattle */}
          <g className="lv-wattle">
            <path d="M115 84 C122 88 122 100 116 104 C111 100 111 90 115 84Z" fill="#e0263f" />
          </g>
        </g>
      </g>
    </svg>
  );
}

const COIN = {
  1: { face: ["#fff6c9", "#f7c531", "#a86c00"], edge: "#8a5800", label: "#6b4300" },
  2: { face: ["#ffffff", "#c9d1d9", "#6f7b87"], edge: "#56616c", label: "#3a434c" },
  3: { face: ["#ffe1c4", "#d98a4a", "#7a3d12"], edge: "#6a3410", label: "#4d2509" },
} as const;

/** A thick, spinning 3D medal coin with the place number on it. */
export function Coin3D({ place, size = 64, spin = true }: { place: 1 | 2 | 3; size?: number; spin?: boolean }) {
  const c = COIN[place];
  const layers = 8;
  return (
    <div className="lv-coin-scene" style={{ width: size, height: size }}>
      <div className={`lv-coin ${spin ? "lv-coin-spin" : ""}`} style={{ "--cd": `${place * 0.4}s` } as CSSProperties}>
        {Array.from({ length: layers }, (_, i) => (
          <span key={i} className="lv-coin-layer" style={{ transform: `translateZ(${i - layers / 2}px)`, background: c.edge }} />
        ))}
        {[1, -1].map((side) => (
          <span
            key={side}
            className="lv-coin-face"
            style={{
              transform: `translateZ(${(side * layers) / 2}px) ${side < 0 ? "rotateY(180deg)" : ""}`,
              background: `radial-gradient(circle at 35% 30%, ${c.face[0]}, ${c.face[1]} 45%, ${c.face[2]})`,
              color: c.label,
              fontSize: size * 0.46,
            }}
          >
            <span className="lv-coin-ring" />
            {place}
          </span>
        ))}
      </div>
    </div>
  );
}

/** One block of the podium, drawn as a real 3D box (front, top and side faces). */
export function PodiumBlock({ place, height, children }: { place: 1 | 2 | 3; height: string; children?: ReactNode }) {
  const color = { 1: ["#ffd75e", "#e0a10f", "#9a6a00"], 2: ["#e9eef2", "#aeb8c2", "#6a7682"], 3: ["#f0b27c", "#c46e32", "#7a3d12"] }[place];
  return (
    <div className="lv-block" style={{ height }}>
      <div className="lv-block-top" style={{ background: `linear-gradient(180deg, ${color[0]}, ${color[1]})` }} />
      <div className="lv-block-side" style={{ background: `linear-gradient(180deg, ${color[2]}, #2a1608)` }} />
      <div className="lv-block-front" style={{ background: `linear-gradient(180deg, ${color[1]}, ${color[2]})` }}>
        <span className="lv-block-shine" />
        {children}
      </div>
    </div>
  );
}

export function Crown({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 80 60" aria-hidden className="lv-crown">
      <defs>
        <linearGradient id="crown-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset="0.5" stopColor="#ffc21a" />
          <stop offset="1" stopColor="#b07400" />
        </linearGradient>
      </defs>
      <path d="M6 52 L4 16 L24 32 L40 6 L56 32 L76 16 L74 52Z" fill="url(#crown-g)" stroke="#8a5a00" strokeWidth="2" strokeLinejoin="round" />
      <rect x="6" y="46" width="68" height="8" rx="3" fill="#e0a10f" stroke="#8a5a00" strokeWidth="2" />
      <circle cx="40" cy="36" r="5" fill="#e0263f" />
      <circle cx="22" cy="40" r="3.5" fill="#2f80ff" />
      <circle cx="58" cy="40" r="3.5" fill="#1f8a5b" />
      <path d="M14 22 L18 44" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A string of twinkling holiday bulbs draped across the top of the screen. */
export function StringLights({ count = 22 }: { count?: number }) {
  const colors = ["#ff4d5e", "#ffd23f", "#3fbf86", "#5aa9ff", "#ff9f1a"];
  return (
    <div aria-hidden className="lv-lights">
      <svg viewBox="0 0 1000 60" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-full w-full">
        <path d="M0 8 Q 50 40 100 10 T 200 10 T 300 10 T 400 10 T 500 10 T 600 10 T 700 10 T 800 10 T 900 10 T 1000 8" stroke="#1d2a24" strokeWidth="3" fill="none" />
      </svg>
      {Array.from({ length: count }, (_, i) => {
        const x = (i + 0.5) / count;
        // follow the wire's sag roughly
        const sag = Math.abs(Math.sin(x * Math.PI * 10)) * 2.1;
        return (
          <span
            key={i}
            className="lv-bulb"
            style={{ left: `${x * 100}%`, top: `${0.35 + sag * 0.6}rem`, "--c": colors[i % colors.length], "--bd": `${(i % 5) * 0.37}s` } as CSSProperties}
          />
        );
      })}
    </div>
  );
}

const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Leaves through November, snow in December. Always animated on the dashboard. */
export function LiveFlakes({ winter }: { winter: boolean }) {
  const n = winter ? 46 : 26;
  const glyphs = winter ? ["❄", "❅", "•", "❆"] : ["🍂", "🍁", "🍂", "🍃"];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: n }, (_, i) => {
        const size = winter ? 0.6 + rand(i, 1) * 1.4 : 1.1 + rand(i, 1) * 1.3;
        return (
          <span
            key={i}
            className="lv-flake"
            style={
              {
                left: `${rand(i, 2) * 100}%`,
                fontSize: `${size}rem`,
                color: "#fff",
                "--dur": `${10 + rand(i, 3) * 14}s`,
                "--delay": `${-rand(i, 4) * 24}s`,
                "--drift": `${(rand(i, 5) - 0.5) * 12}rem`,
                "--spin": `${(rand(i, 6) - 0.5) * 720}deg`,
                "--o": winter ? 0.35 + rand(i, 7) * 0.5 : 0.55 + rand(i, 7) * 0.4,
              } as CSSProperties
            }
          >
            {glyphs[i % glyphs.length]}
          </span>
        );
      })}
    </div>
  );
}
