"use client";

import { Star } from "lucide-react";
import { cn } from "./ui";

/** Tap 1–5 stars. Tapping the same star again clears it. */
export function StarRating({ value, onChange, size = 32 }: { value: number | null; onChange?: (v: number | null) => void; size?: number }) {
  const readOnly = !onChange;
  return (
    <div className="flex gap-1" role={readOnly ? "img" : "radiogroup"} aria-label={value ? `${value} out of 5 stars` : "Rate 1 to 5 stars"}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value != null && n <= value;
        const icon = <Star style={{ width: size, height: size }} className={cn(on ? "fill-gold text-gold" : "text-line")} strokeWidth={on ? 0 : 1.75} />;
        return readOnly ? (
          <span key={n}>{icon}</span>
        ) : (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onChange!(value === n ? null : n)}
            className="transition active:scale-90"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
