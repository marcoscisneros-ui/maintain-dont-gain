"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Browser-side Supabase client. Security is enforced by database rules (RLS). */
export function supabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. See README.md.",
      );
    }
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "mdg-auth" },
    });
  }
  return client;
}

export type Profile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  start_weight: number | null;
  height_in: number | null;
  calorie_target: number;
  step_goal: number;
  onboarded: boolean;
  is_admin: boolean;
  created_at: string;
  last_seen_at: string;
};
