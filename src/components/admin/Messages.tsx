"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, MessageSquareText, Search, Send } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Sheet } from "@/components/Sheet";
import { Button, Chip, Empty, ErrorText, Field, Input, Textarea, cn } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/content";
import { formatPhone } from "@/lib/phone";
import { smsLink } from "@/lib/messages";
import { VAPID_PUBLIC_KEY, sendPush } from "@/lib/push";
import type { MemberStats } from "@/lib/admin";

type Audience = "everyone" | "notToday" | "pending" | "gold" | "diamond" | "pick";
const AUDIENCES: { id: Audience; label: string }[] = [
  { id: "everyone", label: "Everyone" },
  { id: "notToday", label: "Haven't logged today" },
  { id: "pending", label: "Pending level" },
  { id: "gold", label: "🥇 Gold" },
  { id: "diamond", label: "💎 Diamond" },
  { id: "pick", label: "Pick members…" },
];

type Sent = { id: number; title: string | null; body: string; audience: string | null; created_at: string; total: number; read: number };

/** Write a message to members (in-app inbox), or open a group text instead. Also shows sent messages + read counts. */
export function MessagesSheet({ stats, presetIds, onClose }: { stats: MemberStats[]; presetIds?: string[]; onClose: () => void }) {
  const { profile: me } = useAuth();
  const [tab, setTab] = useState<"new" | "sent">("new");
  const [audience, setAudience] = useState<Audience>(presetIds?.length ? "pick" : "everyone");
  const [picked, setPicked] = useState<Set<string>>(new Set(presetIds ?? []));
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState<Sent[] | null>(null);
  const [alsoPush, setAlsoPush] = useState(true);
  const [pushUsers, setPushUsers] = useState<Set<string>>(new Set());
  useEffect(() => {
    supabase()
      .from("push_subscriptions")
      .select("user_id")
      .then(({ data }) => setPushUsers(new Set((data ?? []).map((r) => r.user_id as string))));
  }, []);

  const members = useMemo(() => stats.filter((m) => m.profile.id !== me?.id), [stats, me?.id]);
  const recipients = useMemo(() => {
    switch (audience) {
      case "everyone":
        return members;
      case "notToday":
        return members.filter((m) => !m.loggedToday);
      case "pending":
        return members.filter((m) => m.profile.tier_status === "pending");
      case "gold":
        return members.filter((m) => m.profile.tier === "gold" && m.profile.tier_status === "confirmed");
      case "diamond":
        return members.filter((m) => m.profile.tier === "diamond" && m.profile.tier_status === "confirmed");
      case "pick":
        return members.filter((m) => picked.has(m.profile.id));
    }
  }, [audience, members, picked]);

  const audienceLabel = () => {
    const labels: Record<Exclude<Audience, "pick">, string> = {
      everyone: "Everyone",
      notToday: "Haven't logged today",
      pending: "Pending level",
      gold: "Gold members",
      diamond: "Diamond members",
    };
    if (audience !== "pick") return labels[audience];
    if (recipients.length === 1) return `${recipients[0].profile.first_name} ${recipients[0].profile.last_name.slice(0, 1)}.`;
    return `${recipients.length} picked members`;
  };

  const withPush = recipients.filter((m) => pushUsers.has(m.profile.id)).length;

  const loadSent = useCallback(async () => {
    const [m, r] = await Promise.all([
      supabase().from("messages").select("id,title,body,audience,created_at").order("created_at", { ascending: false }).limit(50),
      supabase().from("message_recipients").select("message_id,read_at"),
    ]);
    if (m.error) return setSent([]);
    const counts = new Map<number, { total: number; read: number }>();
    for (const row of r.data ?? []) {
      const c = counts.get(row.message_id) ?? { total: 0, read: 0 };
      c.total++;
      if (row.read_at) c.read++;
      counts.set(row.message_id, c);
    }
    setSent((m.data ?? []).map((x) => ({ ...x, ...(counts.get(x.id) ?? { total: 0, read: 0 }) })));
  }, []);
  useEffect(() => {
    if (tab === "sent") loadSent();
  }, [tab, loadSent]);

  async function send() {
    setError("");
    if (!body.trim()) return setError("Write your message first.");
    if (!recipients.length) return setError("Nobody matches. Pick at least one member.");
    setBusy(true);
    const { data: msg, error: e1 } = await supabase()
      .from("messages")
      .insert({ sender_id: me?.id, title: title.trim() || null, body: body.trim(), audience: audienceLabel() })
      .select("id")
      .single();
    if (e1 || !msg) {
      setBusy(false);
      return setError(e1?.message.includes("does not exist") || e1?.code === "42P01" ? "Run 11_messages.sql in Supabase first." : (e1?.message ?? "Couldn't send."));
    }
    const { error: e2 } = await supabase()
      .from("message_recipients")
      .insert(recipients.map((m) => ({ message_id: msg.id, user_id: m.profile.id })));
    setBusy(false);
    if (e2) return setError(e2.message);
    let pushNote = "";
    if (alsoPush && VAPID_PUBLIC_KEY && withPush > 0) {
      const r = await sendPush(
        recipients.map((m) => m.profile.id),
        title.trim() || `Message from ${me?.first_name ?? "Marcos"}`,
        body.trim(),
      );
      pushNote = r.error ? ` Phone notifications didn't go out: ${r.error}` : ` 📲 Phone notification delivered to ${r.sent ?? 0} device${r.sent === 1 ? "" : "s"}.`;
    }
    setDone(`Sent to ${recipients.length === 1 ? "1 member's" : `${recipients.length} members'`} inbox.${pushNote}`);
    setTitle("");
    setBody("");
  }

  const phones = recipients.map((m) => m.profile.phone).filter(Boolean) as string[];
  const textBody = [title.trim(), body.trim()].filter(Boolean).join("\n\n");

  return (
    <Sheet title="✉️ Messages" onClose={onClose}>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-card-2 p-1 ring-1 ring-line">
        {(["new", "sent"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("min-h-10 rounded-xl text-sm font-semibold", tab === t ? "bg-card shadow-card" : "text-muted")}>
            {t === "new" ? "New message" : "Sent"}
          </button>
        ))}
      </div>

      {tab === "new" ? (
        done ? (
          <div className="fade space-y-4 text-center">
            <p className="text-5xl">📬</p>
            <p className="font-semibold">{done}</p>
            <Button className="w-full" variant="secondary" onClick={() => setDone("")}>
              Write another
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Send to</p>
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map((a) => (
                  <Chip key={a.id} selected={audience === a.id} onClick={() => setAudience(a.id)}>
                    {a.label}
                  </Chip>
                ))}
              </div>
            </div>

            {audience === "pick" && (
              <div className="rounded-2xl bg-card-2 p-3">
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-10 bg-card pl-9 text-sm" />
                </div>
                <ul className="max-h-56 overflow-y-auto">
                  {members
                    .filter((m) => `${m.profile.first_name} ${m.profile.last_name}`.toLowerCase().includes(q.toLowerCase()))
                    .map((m) => {
                      const on = picked.has(m.profile.id);
                      return (
                        <li key={m.profile.id}>
                          <button
                            type="button"
                            onClick={() => {
                              const n = new Set(picked);
                              if (on) n.delete(m.profile.id);
                              else n.add(m.profile.id);
                              setPicked(n);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left active:bg-card"
                          >
                            <span className={cn("flex size-5 items-center justify-center rounded-md ring-2", on ? "bg-brand text-white ring-brand" : "ring-line")}>
                              {on && <Check className="size-3.5" strokeWidth={3} />}
                            </span>
                            <span className="flex-1 text-sm font-medium">
                              {m.profile.first_name} {m.profile.last_name}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}

            <p className="text-sm font-semibold">
              Goes to <span className="text-brand">{recipients.length}</span> member{recipients.length === 1 ? "" : "s"}
            </p>

            <Field label="Title (optional)">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-base" placeholder="Turkey Burn class tomorrow!" />
            </Field>
            <Field label="Message">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Write it like you'd text them." />
            </Field>
            {VAPID_PUBLIC_KEY ? (
              <label className="flex items-start gap-3 rounded-2xl bg-card-2 px-4 py-3 text-sm">
                <input type="checkbox" checked={alsoPush} onChange={(e) => setAlsoPush(e.target.checked)} className="mt-0.5 size-5 accent-[var(--brand)]" />
                <span>
                  <b>📲 Also send a phone notification</b>
                  <span className="block text-xs text-muted">
                    {withPush} of {recipients.length} have notifications turned on. Everyone still gets it in their inbox.
                  </span>
                </span>
              </label>
            ) : (
              <p className="rounded-2xl bg-card-2 px-4 py-3 text-xs text-muted">
                📲 Want this to pop up on their phones? Set up phone notifications in Admin → Settings.
              </p>
            )}
            <ErrorText>{error}</ErrorText>
            <Button className="w-full" onClick={send} loading={busy} disabled={!recipients.length}>
              <Send className="size-5" /> Send to inbox
            </Button>

            <div className="rounded-2xl bg-card-2 p-3">
              <p className="text-sm font-semibold">Or text them from your phone</p>
              <p className="mb-2 text-xs text-muted">
                {phones.length} of {recipients.length} have a phone number. Opens your messages app with the numbers and your message filled in.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={phones.length ? smsLink(phones, textBody) : undefined}
                  aria-disabled={!phones.length}
                  className={cn(
                    "flex min-h-10 items-center justify-center gap-2 rounded-xl bg-card text-sm font-semibold ring-1 ring-line",
                    !phones.length && "pointer-events-none opacity-40",
                  )}
                >
                  <MessageSquareText className="size-4" /> Text instead
                </a>
                <button
                  type="button"
                  disabled={!phones.length}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(phones.map(formatPhone).join(", "));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    } catch {}
                  }}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-card text-sm font-semibold ring-1 ring-line disabled:opacity-40"
                >
                  <Copy className="size-4" /> {copied ? "Copied!" : "Copy numbers"}
                </button>
              </div>
            </div>
          </div>
        )
      ) : !sent ? (
        <div className="h-40 animate-pulse rounded-2xl bg-card-2" />
      ) : sent.length === 0 ? (
        <Empty>No messages sent yet.</Empty>
      ) : (
        <ul className="space-y-2">
          {sent.map((m) => (
            <li key={m.id} className="rounded-2xl bg-card-2 p-3">
              <div className="flex items-center justify-between gap-2 text-xs text-muted">
                <span>
                  To {m.audience ?? "members"} · {timeAgo(m.created_at)}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 font-bold", m.read === m.total ? "bg-accent/12 text-accent" : "bg-card text-ink")}>
                  👀 {m.read} of {m.total} read
                </span>
              </div>
              {m.title && <p className="mt-1 font-semibold">{m.title}</p>}
              <p className="line-clamp-3 text-sm">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
