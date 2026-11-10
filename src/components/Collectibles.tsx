// Glossy "3D" collectibles drawn with gradients + highlights. Pure SVG, no downloads.

import { TROPHY_DATA_URL } from "@/lib/trophy";

export type CollectibleKind = "dumbbell" | "apple" | "medal" | "star" | "trophy";

export function Collectible({ kind, size = 150 }: { kind: CollectibleKind; size?: number }) {
  if (kind === "dumbbell") return <Dumbbell size={size} />;
  if (kind === "apple") return <Apple size={size} />;
  if (kind === "medal") return <Medal size={size} />;
  // eslint-disable-next-line @next/next/no-img-element
  if (kind === "trophy") return <img src={TROPHY_DATA_URL} width={size} height={size} alt="" />;
  return <Star size={size} />;
}

function Dumbbell({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#c9d1d9" />
          <stop offset="0.55" stopColor="#7b8794" />
          <stop offset="0.8" stopColor="#d7dee5" />
          <stop offset="1" stopColor="#5b6672" />
        </linearGradient>
        <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6b7d" />
          <stop offset="0.5" stopColor="#d61f3c" />
          <stop offset="1" stopColor="#7d0d22" />
        </linearGradient>
        <linearGradient id="plateEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8d1027" />
          <stop offset="1" stopColor="#b5172f" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="172" rx="70" ry="9" fill="#000" opacity="0.18" />
      {/* bar */}
      <rect x="28" y="92" width="144" height="16" rx="8" fill="url(#chrome)" />
      {/* grip knurl */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={72 + i * 6.5} y="93" width="2" height="14" fill="#6b7682" opacity="0.5" />
      ))}
      {/* plates: left */}
      {[
        { x: 34, h: 96 },
        { x: 52, h: 76 },
      ].map((p, i) => (
        <g key={"l" + i}>
          <rect x={p.x + 4} y={100 - p.h / 2} width="14" height={p.h} rx="6" fill="url(#plateEdge)" />
          <rect x={p.x} y={100 - p.h / 2} width="14" height={p.h} rx="6" fill="url(#plate)" />
          <rect x={p.x + 3} y={100 - p.h / 2 + 6} width="3.5" height={p.h - 20} rx="2" fill="#fff" opacity="0.55" />
        </g>
      ))}
      {/* plates: right */}
      {[
        { x: 134, h: 76 },
        { x: 152, h: 96 },
      ].map((p, i) => (
        <g key={"r" + i}>
          <rect x={p.x + 4} y={100 - p.h / 2} width="14" height={p.h} rx="6" fill="url(#plateEdge)" />
          <rect x={p.x} y={100 - p.h / 2} width="14" height={p.h} rx="6" fill="url(#plate)" />
          <rect x={p.x + 3} y={100 - p.h / 2 + 6} width="3.5" height={p.h - 20} rx="2" fill="#fff" opacity="0.55" />
        </g>
      ))}
      {/* end caps */}
      <rect x="22" y="94" width="10" height="12" rx="4" fill="url(#chrome)" />
      <rect x="168" y="94" width="10" height="12" rx="4" fill="url(#chrome)" />
    </svg>
  );
}

function Apple({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <radialGradient id="appleBody" cx="38%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ff8a8a" />
          <stop offset="0.45" stopColor="#e3263c" />
          <stop offset="1" stopColor="#8a0b1d" />
        </radialGradient>
        <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7ee08f" />
          <stop offset="1" stopColor="#1f8a3a" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="176" rx="56" ry="8" fill="#000" opacity="0.18" />
      <path d="M100 58 C70 38 30 52 30 98 C30 140 62 172 86 168 C94 167 96 162 100 162 C104 162 106 167 114 168 C138 172 170 140 170 98 C170 52 130 38 100 58 Z" fill="url(#appleBody)" />
      <path d="M100 60 C104 44 108 34 116 26" stroke="#6b3b12" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M108 46 C122 26 150 28 156 36 C140 50 122 54 108 46 Z" fill="url(#leaf)" />
      <ellipse cx="66" cy="84" rx="14" ry="24" fill="#fff" opacity="0.5" transform="rotate(-20 66 84)" />
      <ellipse cx="78" cy="66" rx="5" ry="7" fill="#fff" opacity="0.7" />
    </svg>
  );
}

function Medal({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <radialGradient id="gold" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff6c9" />
          <stop offset="0.4" stopColor="#f7c531" />
          <stop offset="1" stopColor="#a86c00" />
        </radialGradient>
      </defs>
      <path d="M62 20 L92 92 L78 98 L46 26 Z" fill="#2f80ff" />
      <path d="M138 20 L108 92 L122 98 L154 26 Z" fill="#e3263c" />
      <ellipse cx="100" cy="182" rx="44" ry="7" fill="#000" opacity="0.18" />
      <circle cx="100" cy="122" r="52" fill="url(#gold)" stroke="#a86c00" strokeWidth="3" />
      <circle cx="100" cy="122" r="40" fill="none" stroke="#fff3b0" strokeWidth="3" opacity="0.8" />
      <text x="100" y="136" textAnchor="middle" fontSize="40">👟</text>
      <ellipse cx="80" cy="98" rx="14" ry="8" fill="#fff" opacity="0.5" transform="rotate(-30 80 98)" />
    </svg>
  );
}

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <linearGradient id="starG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset="0.45" stopColor="#ffc21a" />
          <stop offset="1" stopColor="#c47a00" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="180" rx="56" ry="8" fill="#000" opacity="0.18" />
      <path d="M100 18 L124 72 L182 78 L138 117 L151 174 L100 145 L49 174 L62 117 L18 78 L76 72 Z" fill="url(#starG)" stroke="#b06d00" strokeWidth="3" strokeLinejoin="round" />
      <path d="M100 40 L116 76 L100 130 L84 76 Z" fill="#fff" opacity="0.35" />
      <circle cx="78" cy="84" r="6" fill="#fff" opacity="0.7" />
    </svg>
  );
}
