"use client";

import { addDays, formatDate } from "./dates";

/** Gold trophy artwork; `plaque` is the text on the base. */
export const trophySvg = (plaque: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#9a6200"/><stop offset="0.22" stop-color="#ffd84d"/>
    <stop offset="0.42" stop-color="#fff6c4"/><stop offset="0.6" stop-color="#f5b51b"/>
    <stop offset="1" stop-color="#8a5400"/>
  </linearGradient>
  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#b87700"/>
  </linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5a2a17"/><stop offset="1" stop-color="#2b120a"/>
  </linearGradient>
  <radialGradient id="star" cx="50%" cy="40%" r="60%">
    <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffe066"/>
  </radialGradient>
</defs>
<ellipse cx="200" cy="378" rx="120" ry="12" fill="#000" opacity="0.25"/>
<path d="M118 92 C60 92 52 160 112 196 L122 180 C86 156 90 116 122 116 Z" fill="url(#gv)" stroke="#8a5400" stroke-width="3"/>
<path d="M282 92 C340 92 348 160 288 196 L278 180 C314 156 310 116 278 116 Z" fill="url(#gv)" stroke="#8a5400" stroke-width="3"/>
<path d="M108 70 H292 C292 170 258 226 200 238 C142 226 108 170 108 70 Z" fill="url(#g)" stroke="#8a5400" stroke-width="3"/>
<ellipse cx="200" cy="70" rx="92" ry="14" fill="#fff3b0" stroke="#8a5400" stroke-width="3"/>
<ellipse cx="200" cy="72" rx="78" ry="8" fill="#c58a10" opacity="0.6"/>
<path d="M200 112 L211 136 L237 138 L217 155 L223 181 L200 167 L177 181 L183 155 L163 138 L189 136 Z" fill="url(#star)" stroke="#b87700" stroke-width="2"/>
<path d="M130 86 C132 140 150 186 176 212" stroke="#fff" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.45"/>
<rect x="186" y="236" width="28" height="44" fill="url(#g)" stroke="#8a5400" stroke-width="3"/>
<path d="M150 280 H250 L262 304 H138 Z" fill="url(#g)" stroke="#8a5400" stroke-width="3"/>
<rect x="112" y="304" width="176" height="62" rx="8" fill="url(#wood)" stroke="#1a0904" stroke-width="3"/>
<rect x="140" y="318" width="120" height="34" rx="4" fill="url(#g)" stroke="#8a5400" stroke-width="2"/>
<text x="200" y="342" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="#5a3300">${plaque}</text>
</svg>`;

const toDataUrl = (svg: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
export const TROPHY_DATA_URL = toDataUrl(trophySvg("WEEK WIN"));

export type TrophyInfo = { name: string; weekStart: string; trophyNo: number; weekNo: number; totalWeeks: number; days: number };

export function weekLabel(weekStart: string) {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.slice(5, 7) === end.slice(5, 7);
  return `${formatDate(weekStart, { month: "short", day: "numeric" })} – ${formatDate(end, sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" })}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/** Text that shrinks until it fits the given width. */
function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, start: number, maxWidth: number, family: string) {
  let size = start;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 20);
  return size;
}

export type AwardCard = { plaque: string; title: string; name: string; line1: string; line2: string; line3: string };

/** Weekly trophy picture. */
export function renderTrophyJPG(t: TrophyInfo): Promise<Blob> {
  return renderAwardJPG({
    plaque: `${t.days} DAYS`,
    title: `${t.days}-WORKOUT WEEK!`,
    name: t.name,
    line1: `Week of ${weekLabel(t.weekStart)}`,
    line2: `🏆 Trophy #${t.trophyNo}  ·  Week ${t.weekNo} of ${t.totalWeeks}`,
    line3: "Holding the line through the holidays 💪",
  });
}

/** Draws a shareable award picture (1080×1350, Facebook's portrait size) and returns a JPG. */
export async function renderAwardJPG(t: AwardCard): Promise<Blob> {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  try {
    await Promise.all([document.fonts.load(`900 80px ${family}`), document.fonts.load(`600 40px ${family}`)]);
  } catch {}

  // festive background
  const bg = ctx.createRadialGradient(W / 2, 520, 80, W / 2, 620, 900);
  bg.addColorStop(0, "#f29445");
  bg.addColorStop(0.45, "#c8283f");
  bg.addColorStop(1, "#5c0b19");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // light rays behind the trophy
  ctx.save();
  ctx.translate(W / 2, 470);
  for (let i = 0; i < 24; i++) {
    ctx.rotate((Math.PI * 2) / 24);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-38, -760);
    ctx.lineTo(38, -760);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? "rgba(255,230,140,0.10)" : "rgba(255,255,255,0.05)";
    ctx.fill();
  }
  ctx.restore();
  const glow = ctx.createRadialGradient(W / 2, 470, 0, W / 2, 470, 360);
  glow.addColorStop(0, "rgba(255,236,160,0.55)");
  glow.addColorStop(1, "rgba(255,236,160,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // snow / confetti sparkles (same pattern every time)
  for (let i = 0; i < 70; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * W;
    const y = (Math.sin(i * 78.233) * 12345.678 % 1 + 1) % 1 * H;
    const r = 2 + (i % 4);
    ctx.fillStyle = i % 5 === 0 ? "rgba(255,210,63,0.8)" : "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // gold frame
  ctx.strokeStyle = "#f7c531";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(28, 28, W - 56, H - 56, 40);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,243,176,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(48, 48, W - 96, H - 96, 30);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // header
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `800 36px ${family}`;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "8px";
  ctx.fillText("MAINTAIN, DON'T GAIN", W / 2, 140);
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";

  // trophy
  const img = await loadImage(toDataUrl(trophySvg(t.plaque)));
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.drawImage(img, W / 2 - 300, 170, 600, 600);
  ctx.restore();

  // title
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#fff";
  const title = t.title;
  fitText(ctx, title, 900, 104, 940, family);
  ctx.fillText(title, W / 2, 870);
  ctx.restore();

  // gold ribbon with the name
  const rx = 90, ry = 920, rw = W - 180, rh = 132;
  ctx.fillStyle = "#a86c00";
  ctx.beginPath(); // ribbon tails
  ctx.moveTo(rx + 20, ry + 30); ctx.lineTo(rx - 40, ry + 30); ctx.lineTo(rx - 10, ry + 66 + 30); ctx.lineTo(rx - 40, ry + rh + 30); ctx.lineTo(rx + 20, ry + rh + 30); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(rx + rw - 20, ry + 30); ctx.lineTo(rx + rw + 40, ry + 30); ctx.lineTo(rx + rw + 10, ry + 66 + 30); ctx.lineTo(rx + rw + 40, ry + rh + 30); ctx.lineTo(rx + rw - 20, ry + rh + 30); ctx.closePath(); ctx.fill();
  const gold = ctx.createLinearGradient(0, ry, 0, ry + rh);
  gold.addColorStop(0, "#fff0a0");
  gold.addColorStop(0.5, "#f5b51b");
  gold.addColorStop(1, "#c88a00");
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, 22);
  ctx.fill();
  ctx.fillStyle = "#4a2c00";
  fitText(ctx, t.name, 900, 76, rw - 80, family);
  ctx.fillText(t.name, W / 2, ry + rh / 2 + 26);

  // details
  ctx.fillStyle = "#fff";
  ctx.font = `700 46px ${family}`;
  fitText(ctx, t.line1, 700, 46, 900, family);
  ctx.fillText(t.line1, W / 2, 1150);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `600 34px ${family}`;
  fitText(ctx, t.line2, 600, 34, 900, family);
  ctx.fillText(t.line2, W / 2, 1210);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `600 30px ${family}`;
  fitText(ctx, t.line3, 600, 30, 900, family);
  ctx.fillText(t.line3, W / 2, 1268);

  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't make the image"))), "image/jpeg", 0.92));
}
