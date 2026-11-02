"use client";

import { useRef } from "react";
import { cn } from "./ui";

/** Four big boxes for a 4-digit PIN, using the phone's number pad. */
export function PinInput({
  value,
  onChange,
  autoFocus,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="group relative" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        maxLength={4}
        className="absolute inset-0 z-10 w-full opacity-0"
        aria-label="4-digit PIN"
      />
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => {
          const filled = i < value.length;
          const active = i === Math.min(value.length, 3);
          return (
            <div
              key={i}
              className={cn(
                "flex h-16 items-center justify-center rounded-2xl bg-card-2 text-3xl font-bold ring-1 ring-line transition",
                active && "group-focus-within:ring-2 group-focus-within:ring-brand",
              )}
            >
              {filled ? <span className="pop inline-block size-3.5 rounded-full bg-ink" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
