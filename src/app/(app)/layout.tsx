"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BottomNav } from "@/components/BottomNav";
import { CelebrationProvider } from "@/components/Celebration";
import { registerServiceWorker } from "@/lib/push";
import { FullScreenLoader } from "@/components/ui";

/** Everything inside (app)/ requires login. New members are sent to /setup first. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { loading, session, profile } = useAuth();

  const needsSetup = !!profile && !profile.onboarded && path !== "/setup";

  useEffect(() => {
    if (session) registerServiceWorker();
  }, [session]);

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace("/login");
    else if (needsSetup) router.replace("/setup");
  }, [loading, session, needsSetup, router]);

  if (loading || !session || !profile || needsSetup) return <FullScreenLoader />;

  const showNav = path !== "/setup" && path !== "/poster";
  return (
    <>
      <CelebrationProvider>
        <main className={`mx-auto max-w-md px-4 pt-safe ${showNav ? "pb-28" : "pb-10"}`}>{children}</main>
        {showNav && <BottomNav />}
      </CelebrationProvider>
    </>
  );
}
