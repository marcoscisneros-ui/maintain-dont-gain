"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { Spinner } from "./ui";
import { supabase } from "@/lib/supabase";
import { squareAvatar } from "@/lib/image";

/** Tap to choose a profile photo. Uploads and returns the public URL. */
export function AvatarPicker({
  userId,
  name,
  url,
  onChange,
  size = 112,
}: {
  userId: string;
  name: string;
  url: string | null;
  onChange: (url: string) => void;
  size?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const blob = await squareAvatar(file);
      const path = `${userId}/${Date.now()}.jpg`;
      const sb = supabase();
      const { error } = await sb.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = sb.storage.from("avatars").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      setErr("Couldn't upload that photo. Try another one.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button type="button" onClick={() => input.current?.click()} className="relative active:scale-[0.98] transition">
        <Avatar url={url} name={name} size={size} className="ring-4" />
        <span className="absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full brand-gradient text-white ring-4 ring-card">
          {busy ? <Spinner className="size-4" /> : <Camera className="size-4" />}
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {err && <p className="mt-2 text-sm text-danger">{err}</p>}
    </div>
  );
}
