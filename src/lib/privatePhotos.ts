"use client";

import { supabase } from "./supabase";
import { compressImage } from "./image";

/** Upload to the private bucket under the member's own folder. Returns the storage path. */
export async function uploadPrivate(userId: string, file: File, prefix: string): Promise<string> {
  const blob = await compressImage(file, 1600, 0.82);
  const path = `${userId}/${prefix}-${Date.now()}.jpg`;
  const { error } = await supabase().storage.from("private").upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

/** Short-lived links so private photos can be shown (only works for the owner or an admin). */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const list = paths.filter(Boolean);
  if (!list.length) return {};
  const { data } = await supabase().storage.from("private").createSignedUrls(list, 60 * 60);
  const out: Record<string, string> = {};
  for (const r of Array.isArray(data) ? data : []) if (r.path && r.signedUrl) out[r.path] = r.signedUrl;
  return out;
}

export async function removePrivate(path: string) {
  await supabase().storage.from("private").remove([path]);
}
