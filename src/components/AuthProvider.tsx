"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, type Profile } from "@/lib/supabase";

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase().from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    const sb = supabase();
    let alive = true;

    sb.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (data.session) {
        await fetchProfile(data.session.user.id);
        // record "last seen" for the admin engagement view (fire and forget)
        sb.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", data.session.user.id).then();
      }
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (!alive) return;
      setSession(s);
      if (event === "SIGNED_OUT") setProfile(null);
      if (event === "SIGNED_IN" && s) {
        // defer: never await Supabase calls inside this callback
        setTimeout(() => fetchProfile(s.user.id), 0);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (session) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase().auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  return (
    <Ctx.Provider value={{ loading, session, profile, refreshProfile, signOut }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
