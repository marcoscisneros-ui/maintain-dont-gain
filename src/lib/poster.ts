"use client";

import QRCode from "qrcode";

export type PosterInfo = { joinUrl: string; dates: string; joinCode?: string };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxW: number, family: string) {
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
    size -= 2;
  } while (size > 12);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lineH;
    } else line = test;
  }
  ctx.fillText(line, x, y);
}

/** The front-desk poster as a letter-size picture (1700×2200 = 8.5×11 in at 200 dpi). */
export async function renderPosterPNG(p: PosterInfo): Promise<Blob> {
  const W = 1700, H = 2200;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  try {
    await Promise.all([document.fonts.load(`900 120px ${family}`), document.fonts.load(`600 40px ${family}`)]);
  } catch {}

  // page
  ctx.fillStyle = "#fbf7f0";
  ctx.fillRect(0, 0, W, H);

  // header band
  const bandH = 820;
  const g = ctx.createLinearGradient(0, 0, W, bandH);
  g.addColorStop(0, "#c8283f");
  g.addColorStop(0.55, "#d9452f");
  g.addColorStop(1, "#e8762c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, bandH);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 60; i++) {
    const x = ((i * 397) % W) + ((i * 13) % 40);
    const y = (i * 211) % (bandH - 40);
    ctx.beginPath();
    ctx.arc(x, y, 3 + (i % 4) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `800 42px ${family}`;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "12px";
  ctx.fillText("THE 7-WEEK HOLIDAY CHALLENGE", W / 2, 150);
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  ctx.fillStyle = "#fff";
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  fit(ctx, "MAINTAIN,", 900, 200, W - 200, family);
  ctx.fillText("MAINTAIN,", W / 2, 360);
  fit(ctx, "DON'T GAIN", 900, 200, W - 200, family);
  ctx.fillText("DON'T GAIN", W / 2, 560);
  ctx.restore();
  ctx.font = `700 56px ${family}`;
  ctx.fillText(`${p.dates} · Free to join`, W / 2, 680);

  // QR card
  const qrSize = 560, pad = 44;
  const cardX = (W - qrSize - pad * 2) / 2, cardY = bandH - 60;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#fff";
  roundRect(ctx, cardX, cardY, qrSize + pad * 2, qrSize + pad * 2, 60);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#f2b51e";
  ctx.lineWidth = 14;
  roundRect(ctx, cardX, cardY, qrSize + pad * 2, qrSize + pad * 2, 60);
  ctx.stroke();
  const qrUrl = await QRCode.toDataURL(p.joinUrl, { width: qrSize, margin: 0, errorCorrectionLevel: "M", color: { dark: "#1d1a17", light: "#ffffff" } });
  const qr = await new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = qrUrl;
  });
  ctx.drawImage(qr, cardX + pad, cardY + pad, qrSize, qrSize);

  let y = cardY + qrSize + pad * 2 + 96;
  ctx.fillStyle = "#c8283f";
  ctx.font = `900 92px ${family}`;
  ctx.fillText("SCAN TO JOIN", W / 2, y);
  y += 58;
  ctx.fillStyle = "#74695e";
  ctx.font = `600 40px ${family}`;
  ctx.fillText(p.joinUrl.replace(/^https?:\/\//, ""), W / 2, y);
  if (p.joinCode) {
    y += 68;
    ctx.fillStyle = "#1d1a17";
    ctx.font = `800 48px ${family}`;
    ctx.fillText(`Challenge code: ${p.joinCode}`, W / 2, y);
  }

  // steps
  const steps = [
    { n: "1", t: "Scan the code", d: "with your phone's camera" },
    { n: "2", t: "Join", d: "first & last name + a 4-digit PIN" },
    { n: "3", t: "Add to Home Screen", d: "iPhone: Share → Add to Home Screen. Android: ⋮ → Add to Home screen" },
  ];
  const boxW = 470, gap = 45, boxH = 316;
  const top = y + 56;
  steps.forEach((s, i) => {
    const x = (W - (boxW * 3 + gap * 2)) / 2 + i * (boxW + gap);
    ctx.fillStyle = "#fff";
    roundRect(ctx, x, top, boxW, boxH, 36);
    ctx.fill();
    ctx.strokeStyle = "#e8dfd1";
    ctx.lineWidth = 3;
    ctx.stroke();
    const cg = ctx.createLinearGradient(x, top, x + boxW, top + 100);
    cg.addColorStop(0, "#c8283f");
    cg.addColorStop(1, "#e8762c");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(x + boxW / 2, top + 60, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `900 50px ${family}`;
    ctx.fillText(s.n, x + boxW / 2, top + 77);
    ctx.fillStyle = "#1d1a17";
    fit(ctx, s.t, 800, 44, boxW - 40, family);
    ctx.fillText(s.t, x + boxW / 2, top + 150);
    ctx.fillStyle = "#74695e";
    ctx.font = `500 28px ${family}`;
    wrap(ctx, s.d, x + boxW / 2, top + 194, boxW - 50, 34);
  });

  // perks + footer
  ctx.fillStyle = "#1d1a17";
  fit(ctx, "🏋️ Log workouts    🎡 Spin the prize wheel    🏆 Earn trophies", 800, 50, W - 160, family);
  ctx.fillText("🏋️ Log workouts    🎡 Spin the prize wheel    🏆 Earn trophies", W / 2, H - 120);
  ctx.fillStyle = "#74695e";
  fit(ctx, "Ask the front desk about 🥇 Gold (4 personal training sessions) and 💎 Diamond (8 sessions).", 600, 34, W - 160, family);
  ctx.fillText("Ask the front desk about 🥇 Gold (4 personal training sessions) and 💎 Diamond (8 sessions).", W / 2, H - 60);

  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't make the poster"))), "image/png"));
}
