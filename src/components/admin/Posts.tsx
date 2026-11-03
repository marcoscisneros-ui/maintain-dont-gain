"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Megaphone, Pencil, Pin } from "lucide-react";
import { ImageField } from "@/components/ImageField";
import { Sheet } from "@/components/Sheet";
import { Button, Card, Empty, ErrorText, Field, Input, Textarea, Toggle, cn } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { centralToISO, isoToCentralLocal } from "@/lib/dates";
import { formatEventTime, loadAnnouncements, timeAgo, type Announcement } from "@/lib/content";

type Draft = Partial<Announcement> & { kind: "news" | "event" };

export function Posts() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);

  const load = useCallback(() => loadAnnouncements().then(setItems), []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => setEditing({ kind: "news", title: "", body: "", pinned: false })} className="text-sm">
          <Megaphone className="size-4" /> New announcement
        </Button>
        <Button onClick={() => setEditing({ kind: "event", title: "", body: "", pinned: false })} className="text-sm">
          <CalendarDays className="size-4" /> New event
        </Button>
      </div>

      {!items ? (
        <div className="h-40 animate-pulse rounded-3xl bg-card" />
      ) : items.length === 0 ? (
        <Empty>No posts yet.</Empty>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <button key={a.id} onClick={() => setEditing(a)} className="block w-full text-left">
              <Card className="flex items-start gap-3 p-4 active:scale-[0.99] transition">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    a.kind === "event" ? "brand-gradient text-white" : "bg-violet/12 text-violet",
                  )}
                >
                  {a.kind === "event" ? <CalendarDays className="size-5" /> : <Megaphone className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {a.pinned && <Pin className="mr-1 inline size-3.5 text-brand" />}
                    {a.title}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {a.kind === "event" && a.event_at ? formatEventTime(a.event_at).full : `Posted ${timeAgo(a.created_at)}`}
                  </p>
                </div>
                <Pencil className="mt-1 size-4 shrink-0 text-muted" />
              </Card>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <PostForm
          draft={editing}
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

function PostForm({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState(draft.kind);
  const [title, setTitle] = useState(draft.title ?? "");
  const [body, setBody] = useState(draft.body ?? "");
  const [image, setImage] = useState<string | null>(draft.image_url ?? null);
  const [when, setWhen] = useState(draft.event_at ? isoToCentralLocal(draft.event_at) : "");
  const [pinned, setPinned] = useState(!!draft.pinned);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!title.trim()) return setError("Add a title.");
    if (kind === "event" && !when) return setError("Pick the event date and time.");
    setBusy(true);
    const row = {
      kind,
      title: title.trim(),
      body: body.trim(),
      image_url: image,
      event_at: kind === "event" && when ? centralToISO(when) : null,
      pinned: kind === "news" ? pinned : false,
    };
    const sb = supabase().from("announcements");
    const { error } = draft.id ? await sb.update(row).eq("id", draft.id) : await sb.insert(row);
    setBusy(false);
    if (error) return setError(error.message);
    onSaved();
  }

  async function remove() {
    if (!draft.id || !confirm("Delete this post?")) return;
    await supabase().from("announcements").delete().eq("id", draft.id);
    onSaved();
  }

  return (
    <Sheet title={draft.id ? "Edit post" : kind === "event" ? "New event" : "New announcement"} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card-2 p-1 ring-1 ring-line">
          {(["news", "event"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn("min-h-10 rounded-xl text-sm font-semibold", kind === k ? "bg-card shadow-card" : "text-muted")}
            >
              {k === "news" ? "Announcement" : "Pop-up / event"}
            </button>
          ))}
        </div>
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-base" placeholder={kind === "event" ? "Turkey Burn pop-up class" : "This week's challenge"} />
        </Field>
        {kind === "event" && (
          <Field label="Date & time (San Angelo time)">
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="text-base" />
          </Field>
        )}
        <Field label="Message" hint={<FormattingHint />}>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} />
        </Field>
        <ImageField value={image} onChange={setImage} folder="posts" />
        {kind === "news" && <Toggle checked={pinned} onChange={setPinned} label="Pin to the top" />}
        <ErrorText>{error}</ErrorText>
        <Button className="w-full" onClick={save} loading={busy}>
          {draft.id ? "Save changes" : "Post it"}
        </Button>
        {draft.id && (
          <Button variant="danger" className="w-full" onClick={remove}>
            Delete
          </Button>
        )}
      </div>
    </Sheet>
  );
}

export function FormattingHint() {
  return (
    <>
      Tips: start a line with <b>- </b> for bullets, <b>1. </b> for steps, <b>## </b> for a heading. Wrap words in <b>**stars**</b> for bold. Links work too.
    </>
  );
}
