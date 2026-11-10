"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Collectible, type CollectibleKind } from "./Collectibles";
import { Confetti } from "./PrizeWheel";
import { playTada, unlockAudio } from "@/lib/sound";

export type CelebrateOptions = {
  kind: CollectibleKind;
  title: string; // e.g. "Dumbbell #12 collected!"
  subtitle?: string; // e.g. "You've lifted your way to 12 workouts"
  points?: number; // shows "+3 pts"
  milestone?: boolean; // bigger fanfare
  action?: { label: string; onClick: () => void }; // e.g. "Get my trophy"; keeps the pop-up open until tapped
};

const Ctx = createContext<(o: CelebrateOptions) => void>(() => {});
export const useCelebrate = () => useContext(Ctx);

const MILESTONES = new Set([1, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100]);
export const isMilestone = (n: number) => MILESTONES.has(n);

/** Full-screen "you did it" moment: spinning 3D collectible, rays, confetti and a ta-da. */
export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<(CelebrateOptions & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // phones only allow sound after a tap: unlock on the first one
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const celebrate = useCallback((o: CelebrateOptions) => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent({ ...o, id: Date.now() });
    playTada(!!o.milestone);
    if (!o.action) timer.current = setTimeout(() => setCurrent(null), o.milestone ? 3400 : 2400);
  }, []);

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent(null);
  };

  return (
    <Ctx.Provider value={celebrate}>
      {children}
      {current &&
        createPortal(
          <div
            key={current.id}
            role="status"
            aria-live="polite"
            onClick={close}
            className="fade fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/55 px-6 text-center backdrop-blur-[2px]"
          >
            <Confetti />
            <div className="relative flex size-64 items-center justify-center">
              <div aria-hidden className="celebrate-rays absolute inset-0 rounded-full" />
              <div aria-hidden className="absolute inset-10 rounded-full bg-[radial-gradient(circle,rgb(255_236_160/0.9),transparent_70%)]" />
              <div className="celebrate-spin relative" style={{ perspective: "600px" }}>
                <Collectible kind={current.kind} size={current.milestone ? 190 : 160} />
              </div>
            </div>
            {current.milestone && (
              <p className="celebrate-pop mb-1 rounded-full bg-gradient-to-r from-[#ffd23f] to-[#ff9f1a] px-4 py-1 text-xs font-black tracking-[0.2em] text-[#4a2c00] uppercase">
                Milestone!
              </p>
            )}
            <p className="celebrate-pop text-3xl leading-tight font-black text-white [text-shadow:0_3px_12px_rgb(0_0_0/0.4)]">{current.title}</p>
            {current.subtitle && <p className="celebrate-pop mt-2 text-lg font-medium text-white/90">{current.subtitle}</p>}
            {!!current.points && current.points > 0 && (
              <p className="celebrate-pop mt-4 rounded-full bg-[#ffd23f] px-5 py-2 text-xl font-black text-[#4a2c00] shadow-lg">+{current.points} pts</p>
            )}
            {current.action ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const a = current.action!;
                    close();
                    a.onClick();
                  }}
                  className="celebrate-pop mt-6 min-h-12 rounded-2xl bg-white px-6 text-base font-black text-[#c8283f] shadow-xl active:scale-95"
                >
                  {current.action.label}
                </button>
                <p className="mt-4 text-xs text-white/60">or tap anywhere to close</p>
              </>
            ) : (
              <p className="mt-8 text-xs text-white/60">Tap anywhere to continue</p>
            )}
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  );
}
