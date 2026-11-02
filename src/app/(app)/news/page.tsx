"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { RichText } from "@/components/RichText";
import { Card, Empty, PageHeader, SectionTitle } from "@/components/ui";
import { useSettings } from "@/lib/settings";
import { formatEventTime, loadAnnouncements, markNewsSeen, splitFeed, timeAgo, type Announcement } from "@/lib/content";

export default function NewsPage() {
  const router = useRouter();
  const settings = useSettings();
  const [all, setAll] = useState<Announcement[] | null>(null);

  useEffect(() => {
    loadAnnouncements().then((a) => {
      setAll(a);
      if (a.length) markNewsSeen(Math.max(...a.map((x) => x.id)));
    });
  }, []);

  const { events, news } = splitFeed(all ?? []);
  const coach = settings?.coach_name || "Marcos";

  return (
    <div className="space-y-4 pt-6">
      <button onClick={() => router.back()} className="-ml-2 flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft className="size-5" /> Back
      </button>
      <PageHeader title="News & Events" subtitle={`Updates from ${coach} and the team.`} />

      {!all ? (
        <div className="h-48 animate-pulse rounded-3xl bg-card" />
      ) : (
        <>
          {events.length > 0 && (
            <section className="rise">
              <SectionTitle>Pop-ups & events</SectionTitle>
              <div className="space-y-3">
                {events.map((e) => {
                  const t = e.event_at ? formatEventTime(e.event_at) : null;
                  return (
                    <Card key={e.id} className="flex gap-4">
                      {t && (
                        <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl brand-gradient text-white">
                          <span className="text-[11px] font-bold tracking-wider">{t.month}</span>
                          <span className="text-2xl leading-none font-bold">{t.day}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-lg leading-snug font-semibold">{e.title}</p>
                        {t && <p className="text-sm font-medium text-brand">{t.full}</p>}
                        {e.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={e.image_url} alt="" className="mt-3 w-full rounded-2xl object-cover" />
                        )}
                        {e.body && <RichText text={e.body} className="mt-2 text-[15px] text-ink/90" />}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rise" style={{ animationDelay: "40ms" }}>
            <SectionTitle>Announcements</SectionTitle>
            {news.length === 0 ? (
              <Empty>No announcements yet.</Empty>
            ) : (
              <div className="space-y-3">
                {news.map((n) => (
                  <Card key={n.id}>
                    <div className="flex items-center gap-3">
                      <Avatar url={settings?.coach_photo_url || null} name={coach} size={40} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{coach}</p>
                        <p className="text-xs text-muted">{timeAgo(n.created_at)}</p>
                      </div>
                      {n.pinned && (
                        <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                          <Pin className="size-3" /> Pinned
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-lg leading-snug font-semibold">{n.title}</p>
                    {n.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.image_url} alt="" className="mt-3 w-full rounded-2xl object-cover" />
                    )}
                    {n.body && <RichText text={n.body} className="mt-2 text-[15px] text-ink/90" />}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
