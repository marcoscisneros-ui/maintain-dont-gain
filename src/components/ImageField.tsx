"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Spinner } from "./ui";
import { uploadContentImage } from "@/lib/admin";

/** Pick an image → uploads immediately → returns the public URL. */
export function ImageField({
  value,
  onChange,
  folder,
  label = "Add a photo (optional)",
  round,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  round?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      onChange(await uploadContentImage(file, folder, round ? 600 : 1600));
    } catch {
      setErr("Upload failed. Try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={round ? "size-20 rounded-full object-cover" : "h-28 rounded-2xl object-cover"} />
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => input.current?.click()} className="text-sm font-semibold text-brand">
              {busy ? <Spinner className="size-4" /> : "Change"}
            </button>
            <button type="button" onClick={() => onChange(null)} className="flex items-center gap-1 text-sm text-muted">
              <Trash2 className="size-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-4 py-4 text-sm font-medium text-muted"
        >
          {busy ? <Spinner className="size-4" /> : <ImagePlus className="size-5" />} {label}
        </button>
      )}
      {err && <p className="mt-1 text-sm text-danger">{err}</p>}
    </div>
  );
}
