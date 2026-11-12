"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import { RichText } from "@/components/RichText";
import { Card, Empty, PageHeader, cn } from "@/components/ui";
import { useSettings } from "@/lib/settings";
import { timeAgo } from "@/lib/content";
import { loadInbox, markRead, type InboxItem } from "@/lib/messages";

export default function InboxPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const settings = useSettings();
  const [items, setItems] = useState<InboxItem[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    loadInbox(profile.id).then((list) => {
      setItems(list);
      // opening the inbox marks everything as read (the "new" dots stay until you leave)
      markRead(profile.id, list.filter((i) => !i.read_at).map((i) => i.message_id));
    });
  }, [profile]);

  const coach = settings?.coach_name || "Marcos";

  return (
    <div className="space-y-4 pt-6">
      <button onClick={() => router.back()} className="-ml-2 flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft className="size-5" /> Back
      </button>
      <PageHeader title="Inbox" subtitle={`Messages from ${coach} and the team.`} />
      {!items ? (
        <div className="h-40 animate-pulse rounded-3xl bg-card" />
      ) : items.length === 0 ? (
        <Empty>No messages yet.</Empty>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <Card key={i.message_id} className={cn("rise", !i.read_at && "ring-2 ring-brand/50")}>
              <div className="flex items-center gap-3">
                <Avatar url={settings?.coach_photo_url || null} name={coach} size={40} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{coach}</p>
                  <p className="text-xs text-muted">{timeAgo(i.messages!.created_at)}</p>
                </div>
                {!i.read_at && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">NEW</span>}
              </div>
              {i.messages!.title && <p className="mt-3 text-lg leading-snug font-semibold">{i.messages!.title}</p>}
              <RichText text={i.messages!.body} className="mt-1 text-[15px] text-ink/90" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
