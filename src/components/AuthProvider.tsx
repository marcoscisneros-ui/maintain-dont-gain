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

  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    let sb: ReturnType<typeof supabase>;
    try {
      sb = supabase();
    } catch {
      setConfigError(true);
      return;
    }
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

  if (configError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
        <p className="text-5xl">🛠️</p>
        <h1 className="mt-4 text-2xl font-bold">Almost ready</h1>
        <p className="mt-2 text-muted">
          The app is missing its Supabase settings. In Vercel, open the project → Settings → Environment Variables, add
          the three values from the README, then redeploy.
        </p>
        <a href="/api/health" className="mt-6 font-semibold text-brand">
          Check setup status →
        </a>
      </main>
    );
  }

  return (
    <Ctx.Provider value={{ loading, session, profile, refreshProfile, signOut }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
