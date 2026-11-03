"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, Flame, Gift, Megaphone, MessageSquareQuote, Settings2, Users } from "lucide-react";
import { Rewards } from "@/components/admin/Rewards";
import { Classes } from "@/components/admin/Classes";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader, cn } from "@/components/ui";
import { Members } from "@/components/admin/Members";
import { Posts } from "@/components/admin/Posts";
import { Library } from "@/components/admin/Library";
import { DailyBank } from "@/components/admin/DailyBank";
import { SettingsPanel } from "@/components/admin/SettingsPanel";

const TABS = [
  { id: "members", label: "Members", Icon: Users },
  { id: "posts", label: "Posts", Icon: Megaphone },
  { id: "daily", label: "Daily", Icon: MessageSquareQuote },
  { id: "rewards", label: "Rewards", Icon: Gift },
  { id: "classes", label: "Classes", Icon: Flame },
  { id: "library", label: "Recipes", Icon: BookOpen },
  { id: "settings", label: "Settings", Icon: Settings2 },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("members");

  useEffect(() => {
    try {
      const t = sessionStorage.getItem("mdg-admin-tab") as Tab | null;
      if (t && TABS.some((x) => x.id === t)) setTab(t);
    } catch {}
  }, []);

  useEffect(() => {
    if (profile && !profile.is_admin) router.replace("/home");
  }, [profile, router]);

  if (!profile?.is_admin) return null;

  function pick(t: Tab) {
    setTab(t);
    try {
      sessionStorage.setItem("mdg-admin-tab", t);
    } catch {}
  }

  return (
    <div className="pt-6">
      <button onClick={() => router.push("/home")} className="-ml-2 flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft className="size-5" /> Back to app
      </button>
      <div className="mt-3">
        <PageHeader title="Admin" subtitle="Run the challenge from here." />
      </div>

      <div className="sticky top-0 z-20 -mx-4 mb-4 bg-bg/90 px-4 py-2 backdrop-blur-xl pt-safe">
        <div className="flex gap-0.5 overflow-x-auto rounded-2xl bg-card-2 p-1 ring-1 ring-line [scrollbar-width:none]">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => pick(id)}
              className={cn(
                "flex min-w-[64px] flex-1 shrink-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-semibold transition",
                tab === id ? "bg-card text-brand shadow-card" : "text-muted",
              )}
            >
              <Icon className="size-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div key={tab} className="fade">
        {tab === "members" && <Members />}
        {tab === "posts" && <Posts />}
        {tab === "daily" && <DailyBank />}
        {tab === "rewards" && <Rewards />}
        {tab === "classes" && <Classes />}
        {tab === "library" && <Library />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}
