"use client";

import { useEffect, useState } from "react";
import { BookOpen, CalendarPlus, Megaphone, MessageCircle, Trophy } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import { ButtonLink, Card, Empty, PageHeader, SectionTitle, cn } from "@/components/ui";
import { loadLeaderboard, ranks, type Row } from "@/lib/leaderboard";
import { useSettings } from "@/lib/settings";

export default function CrewPage() {
  const { profile } = useAuth();
  const settings = useSettings();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    loadLeaderboard().then(setRows);
  }, []);

  if (!profile || !settings) return null;
  const rk = rows ? ranks(rows) : [];
  const podium = rows?.slice(0, 3).filter((r) => r.points > 0) ?? [];

  return (
    <div className="space-y-4 pt-6">
      <PageHeader title="Crew" subtitle="Show up, stack points, cheer each other on." />

      <div className="rise grid grid-cols-2 gap-2">
        {settings.groupme_url ? (
          <ButtonLink href={settings.groupme_url} external variant="secondary" className="text-sm">
            <MessageCircle className="size-4 text-brand" /> GroupMe
          </ButtonLink>
        ) : null}
        {settings.class_url ? (
          <ButtonLink href={settings.class_url} external variant="secondary" className="text-sm">
            <CalendarPlus className="size-4 text-brand" /> Book a class
          </ButtonLink>
        ) : null}
      </div>

      <div className="rise grid grid-cols-2 gap-2">
        <ButtonLink href="/news" variant="secondary" className="text-sm">
          <Megaphone className="size-4 text-violet" /> News & events
        </ButtonLink>
        <ButtonLink href="/library" variant="secondary" className="text-sm">
          <BookOpen className="size-4 text-accent" /> Recipes & tips
        </ButtonLink>
      </div>

      {podium.length > 0 && (
        <Card className="rise overflow-hidden">
          <div className="flex items-end justify-center gap-3 pt-2">
            {[1, 0, 2].map((i) => {
              const r = podium[i];
              if (!r) return <div key={i} className="flex-1" />;
              const h = i === 0 ? "h-24" : i === 1 ? "h-16" : "h-12";
              return (
                <div key={r.user_id} className="flex flex-1 flex-col items-center">
                  <div className="relative">
                    <Avatar url={r.avatar_url} name={`${r.first_name} ${r.last_initial}`} size={i === 0 ? 68 : 54} />
                    {i === 0 && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</span>}
                  </div>
                  <p className="mt-2 max-w-full truncate text-sm font-semibold">
                    {r.first_name} {r.last_initial}.
                  </p>
                  <p className="text-xs font-semibold text-gold">{r.points} pts</p>
                  <div
                    className={cn(
                      "mt-2 flex w-full items-start justify-center rounded-t-xl pt-2 text-lg font-bold text-white",
                      h,
                      i === 0 ? "brand-gradient" : "bg-muted/40",
                    )}
                  >
                    {rk[i]}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="rise" style={{ animationDelay: "40ms" }}>
        <SectionTitle right={<Trophy className="size-5 text-gold" />}>Leaderboard</SectionTitle>
        {!rows ? (
          <div className="h-40 animate-pulse rounded-2xl bg-card-2" />
        ) : rows.length === 0 ? (
          <Empty>No one here yet.</Empty>
        ) : (
          <ol className="space-y-1">
            {rows.map((r, i) => {
              const me = r.user_id === profile.id;
              return (
                <li
                  key={r.user_id}
                  className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5", me && "bg-brand/10 ring-1 ring-brand/30")}
                >
                  <span className="w-6 text-center font-bold text-muted">{rk[i]}</span>
                  <Avatar url={r.avatar_url} name={`${r.first_name} ${r.last_initial}`} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {r.first_name} {r.last_initial}.{me && <span className="text-brand"> (you)</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {r.workouts} workout{r.workouts === 1 ? "" : "s"} · {r.active_days} active day{r.active_days === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="text-lg font-bold">{r.points}</span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card className="rise text-sm" style={{ animationDelay: "80ms" }}>
        <SectionTitle>How points work</SectionTitle>
        <ul className="space-y-2">
          <li className="flex justify-between"><span>🏠 Workout at home</span><b>{settings.points_home} pt</b></li>
          <li className="flex justify-between"><span>🏋️ Workout at the gym</span><b>{settings.points_gym} pts</b></li>
          <li className="flex justify-between"><span>🔥 Take a class</span><b>{settings.points_class} pts</b></li>
        </ul>
        {Number(settings.daily_point_cap) > 0 && (
          <p className="mt-3 text-muted">Max {settings.daily_point_cap} points per day. Consistency beats cramming.</p>
        )}
      </Card>
    </div>
  );
}
