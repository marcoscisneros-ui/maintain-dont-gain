"use client";

import { useCallback, useRef, useState } from "react";

/** Tiny "Logged! +2 pts" confirmation pill. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 2200);
  }, []);
  const node = msg ? (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-safe">
      <div key={msg} className="pop mt-4 rounded-full bg-ink px-5 py-3 font-semibold text-bg shadow-card">{msg}</div>
    </div>
  ) : null;
  return { show, node };
}
