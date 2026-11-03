"use client";

// "Ta-da" chimes synthesized on the phone (no audio files to download).
// Phones only allow sound after the person has tapped something, so we
// "unlock" audio on the first tap anywhere in the app.

let ctx: AudioContext | null = null;
const KEY = "mdg-sound";

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}
export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
  const o = ctx!.createOscillator();
  const g = ctx!.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(ctx!.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

/** Bright little arpeggio. `big` = a longer fanfare for milestones and prizes. */
export function playTada(big = false) {
  if (!soundEnabled()) return;
  unlockAudio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.02;
  const notes = big ? [523.25, 659.25, 783.99, 1046.5, 1318.51] : [659.25, 830.61, 987.77, 1318.51];
  notes.forEach((f, i) => tone(f, t + i * 0.085, 0.55, "triangle", 0.18));
  // final shimmer chord
  const end = t + notes.length * 0.085;
  [1046.5, 1318.51, 1567.98].forEach((f) => tone(f, end, big ? 1.1 : 0.7, "sine", 0.08));
  // sparkle pings
  [2093, 2637, 3136].forEach((f, i) => tone(f, end + 0.05 + i * 0.06, 0.25, "sine", 0.04));
  try {
    navigator.vibrate?.(big ? [30, 40, 30, 40, 60] : [25, 30, 40]);
  } catch {}
}
