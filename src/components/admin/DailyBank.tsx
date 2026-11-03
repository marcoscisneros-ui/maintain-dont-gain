"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, Heart, Lightbulb, MessageSquareQuote, Plus } from "lucide-react";
import { fetchAll } from "@/lib/admin";
import { Sheet } from "@/components/Sheet";
import { Button, Card, ErrorText, Field, Input, Textarea, cn } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/lib/settings";
import { addDays, formatDate, programStatus, todayISO } from "@/lib/dates";
import type { DailyItem } from "@/lib/daily";

type Kind = "coach" | "tip";
type Engagement = { content_id: number; user_id: string; hearted: boolean };
type Stats = Map<number, { seen: number; hearts: number; hearters: string[] }>;

export function DailyBank() {
  const settings = useSettings();
  const [kind, setKind] = useState<Kind>("coach");
  const [items, setItems] = useState<DailyItem[] | null>(null);
  const [editing, setEditing] = useState<Partial<DailyItem> | null>(null);
  const [moving, setMoving] = useState(false);
  const [stats, setStats] = useState<Stats>(new Map());
  const [members, setMembers] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase().from("daily_content").select("*").order("position").order("id");
    setItems((data ?? []) as DailyItem[]);
    // who saw / hearted each message (fails quietly if 04_hearts.sql hasn't been run yet)
    try {
      const [eng, people] = await Promise.all([
        fetchAll<Engagement>("daily_engagement", "content_id,user_id,hearted", "content_id"),
        fetchAll<{ id: string; first_name: string; last_name: string }>("profiles", "id,first_name,last_name", "created_at"),
      ]);
      const name = new Map(people.map((p) => [p.id, `${p.first_name} ${p.last_name.slice(0, 1)}.`]));
      const m: Stats = new Map();
      for (const e of eng) {
        const s = m.get(e.content_id) ?? { seen: 0, hearts: 0, hearters: [] };
        s.seen++;
        if (e.hearted) {
          s.hearts++;
          s.hearters.push(name.get(e.user_id) ?? "Someone");
        }
        m.set(e.content_id, s);
      }
      setStats(m);
      setMembers(people.length);
    } catch {}
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!settings || !items) return <div className="h-64 animate-pulse rounded-3xl bg-card" />;

  const list = items.filter((i) => i.kind === kind);
  const status = programStatus(settings.start_date, settings.end_date, todayISO());
  const todayIndex = status.phase === "during" ? (status.day - 1) % Math.max(list.length, 1) : -1;

  /** Move an item up/down: renumber the list 1..n in its new order. */
  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= list.length || moving) return;
    const next = [...list];
    [next[index], next[j]] = [next[j], next[index]];
    setMoving(true);
    setItems([...items!.filter((i) => i.kind !== kind), ...next.map((it, k) => ({ ...it, position: k + 1 }))]);
    const sb = supabase().from("daily_content");
    await Promise.all(next.map((it, k) => (it.position !== k + 1 ? sb.update({ position: k + 1 }).eq("id", it.id) : null)));
    setMoving(false);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card-2 p-1 ring-1 ring-line">
        {(["coach", "tip"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={cn("flex min-h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold", kind === k ? "bg-card shadow-card" : "text-muted")}
          >
            {k === "coach" ? <MessageSquareQuote className="size-4" /> : <Lightbulb className="size-4" />}
            {k === "coach" ? "Your messages" : "Daily tips"} ({items.filter((i) => i.kind === k).length})
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">
        One per day, in this order: #1 shows on {formatDate(settings.start_date, { month: "short", day: "numeric" })}, #2 the next day, and so on. If the list is shorter than the challenge, it starts over from #1. Use the arrows to reorder.
      </p>
      <Button className="w-full" onClick={() => setEditing({ kind, title: kind === "tip" ? "" : null, body: "" })}>
        <Plus className="size-5" /> Add a {kind === "coach" ? "message" : "tip"}
      </Button>

      <div className="space-y-2">
        {list.map((it, i) => (
          <Card key={it.id} className={cn("p-4", i === todayIndex && "ring-2 ring-brand")}>
            <div className="flex items-start gap-3">
              <button onClick={() => setEditing(it)} className="min-w-0 flex-1 text-left">
                <p className="text-xs font-semibold text-muted">
                  #{i + 1}
                  {i < status.totalDays && ` · ${formatDate(addDays(settings.start_date, i), { weekday: "short", month: "short", day: "numeric" })}`}
                  {i === todayIndex && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] text-white">TODAY</span>}
                </p>
                {it.title && <p className="mt-1 font-semibold">{it.title}</p>}
                <p className="mt-1 line-clamp-3 text-sm text-ink/85">{it.body}</p>
                {kind === "coach" && stats.get(it.id) && (
                  <p className="mt-2 flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1 text-muted">
                      <Eye className="size-3.5" /> {stats.get(it.id)!.seen} seen
                    </span>
                    <span className="flex items-center gap-1 text-brand">
                      <Heart className="size-3.5 fill-current" /> {stats.get(it.id)!.hearts}
                    </span>
                  </p>
                )}
              </button>
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0 || moving} className="rounded-lg p-1.5 text-muted disabled:opacity-25" aria-label="Move up">
                  <ArrowUp className="size-4" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === list.length - 1 || moving} className="rounded-lg p-1.5 text-muted disabled:opacity-25" aria-label="Move down">
                  <ArrowDown className="size-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <ItemForm
          item={editing}
          stats={editing.id ? stats.get(editing.id) : undefined}
          members={members}
          nextPosition={(list[list.length - 1]?.position ?? 0) + 1}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ItemForm({
  item,
  stats,
  members,
  nextPosition,
  onClose,
  onSaved,
}: {
  item: Partial<DailyItem>;
  stats?: { seen: number; hearts: number; hearters: string[] };
  members: number;
  nextPosition: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isTip = item.kind === "tip";
  const [title, setTitle] = useState(item.title ?? "");
  const [body, setBody] = useState(item.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!body.trim()) return setError("Write the message first.");
    setBusy(true);
    const sb = supabase().from("daily_content");
    const row = { title: isTip ? title.trim() || null : null, body: body.trim() };
    const { error } = item.id
      ? await sb.update(row).eq("id", item.id)
      : await sb.insert({ ...row, kind: item.kind, position: nextPosition });
    setBusy(false);
    if (error) return setError(error.message);
    onSaved();
  }

  async function remove() {
    if (!item.id || !confirm("Delete this? Everything after it moves up one day.")) return;
    await supabase().from("daily_content").delete().eq("id", item.id);
    onSaved();
  }

  return (
    <Sheet title={item.id ? (isTip ? "Edit tip" : "Edit message") : isTip ? "New tip" : "New message"} onClose={onClose}>
      <div className="space-y-4">
        {!isTip && stats && (
          <div className="rounded-2xl bg-card-2 p-4 text-sm">
            <p className="flex items-center gap-4 font-semibold">
              <span className="flex items-center gap-1.5">
                <Eye className="size-4 text-muted" /> Seen by {stats.seen}
                {members ? ` of ${members}` : ""}
              </span>
              <span className="flex items-center gap-1.5 text-brand">
                <Heart className="size-4 fill-current" /> {stats.hearts} heart{stats.hearts === 1 ? "" : "s"}
              </span>
            </p>
            {stats.hearters.length > 0 && <p className="mt-2 text-muted">❤️ {stats.hearters.join(", ")}</p>}
          </div>
        )}
        {isTip && (
          <Field label="Tip title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-base" placeholder="Protein at every meal" />
          </Field>
        )}
        <Field label={isTip ? "Tip" : "Your message"} hint={!isTip ? "Write it like you'd text a member. Your name and photo appear above it." : undefined}>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button className="w-full" onClick={save} loading={busy}>
          {item.id ? "Save changes" : "Add to the end"}
        </Button>
        {item.id && (
          <Button variant="danger" className="w-full" onClick={remove}>
            Delete
          </Button>
        )}
      </div>
    </Sheet>
  );
}
