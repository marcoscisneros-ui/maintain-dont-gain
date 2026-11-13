"use client";

import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { RichText } from "./RichText";
import { Sheet } from "./Sheet";
import { Button } from "./ui";
import { markRead, type InboxItem } from "@/lib/messages";

/**
 * Pops up the newest unread message when the app opens (once per message),
 * waiting until the daily welcome pop-up has been closed.
 */
export function MessagePopup({
  userId,
  unread,
  coachName,
  coachPhoto,
  welcomeKey,
  onRead,
}: {
  userId: string;
  unread: InboxItem[];
  coachName: string;
  coachPhoto: string | null;
  welcomeKey: string;
  onRead: () => void;
}) {
  const [item, setItem] = useState<InboxItem | null>(null);

  useEffect(() => {
    if (!unread.length) return;
    const pick = () => {
      try {
        if (!localStorage.getItem(welcomeKey)) return false; // daily welcome still to come
        const top = unread[0];
        if (sessionStorage.getItem(`mdg-popped-${top.message_id}`)) return true;
        sessionStorage.setItem(`mdg-popped-${top.message_id}`, "1");
        setItem(top);
      } catch {}
      return true;
    };
    if (pick()) return;
    const t = setInterval(() => pick() && clearInterval(t), 800);
    return () => clearInterval(t);
  }, [unread, welcomeKey]);

  if (!item?.messages) return null;
  const close = async () => {
    setItem(null);
    await markRead(userId, [item.message_id]);
    onRead();
  };

  return (
    <Sheet title="📬 New message" onClose={close}>
      <div className="flex items-center gap-3">
        <Avatar url={coachPhoto} name={coachName} size={44} />
        <p className="font-semibold">{coachName}</p>
      </div>
      {item.messages.title && <p className="mt-4 text-xl leading-snug font-bold">{item.messages.title}</p>}
      <RichText text={item.messages.body} className="mt-2 text-[16px]" />
      <Button className="mt-6 w-full" onClick={close}>
        Got it 👍
      </Button>
      {unread.length > 1 && <p className="mt-3 text-center text-xs text-muted">{unread.length - 1} more in your Inbox</p>}
    </Sheet>
  );
}
