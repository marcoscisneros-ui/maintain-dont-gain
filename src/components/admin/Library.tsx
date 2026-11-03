"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChefHat, Lightbulb, Pencil, Plus } from "lucide-react";
import { ImageField } from "@/components/ImageField";
import { Sheet } from "@/components/Sheet";
import { Button, Card, Empty, ErrorText, Field, Input, Textarea, cn } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { LibraryItem } from "@/lib/content";
import { FormattingHint } from "./Posts";

type Draft = Partial<LibraryItem> & { kind: "recipe" | "tip" };

const RECIPE_TEMPLATE = `About ___ calories · ___g protein · serves ___

## Ingredients
-
-

## Steps
1.
2. `;

export function Library() {
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [kind, setKind] = useState<"recipe" | "tip">("recipe");
  const [editing, setEditing] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase().from("library_items").select("*").order("category").order("created_at");
    setItems((data ?? []) as LibraryItem[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => Array.from(new Set((items ?? []).filter((i) => i.kind === (editing?.kind ?? kind)).map((i) => i.category))),
    [items, kind, editing?.kind],
  );
  const shown = (items ?? []).filter((i) => i.kind === kind);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card-2 p-1 ring-1 ring-line">
        {(["recipe", "tip"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={cn("flex min-h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold", kind === k ? "bg-card shadow-card" : "text-muted")}
          >
            {k === "recipe" ? <ChefHat className="size-4" /> : <Lightbulb className="size-4" />}
            {k === "recipe" ? "Recipes" : "Tips & tricks"} ({(items ?? []).filter((i) => i.kind === k).length})
          </button>
        ))}
      </div>
      <Button
        className="w-full"
        onClick={() =>
          setEditing({ kind, title: "", category: kind === "recipe" ? "Lunch & Dinner" : "Nutrition", body: kind === "recipe" ? RECIPE_TEMPLATE : "" })
        }
      >
        <Plus className="size-5" /> Add a {kind === "recipe" ? "recipe" : "tip"}
      </Button>

      {!items ? (
        <div className="h-40 animate-pulse rounded-3xl bg-card" />
      ) : shown.length === 0 ? (
        <Empty>Nothing here yet.</Empty>
      ) : (
        <div className="space-y-2">
          {shown.map((i) => (
            <button key={i.id} onClick={() => setEditing(i)} className="block w-full text-left">
              <Card className="flex items-center gap-3 p-4 active:scale-[0.99] transition">
                {i.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image_url} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-card-2 text-xl">
                    {i.kind === "recipe" ? "🍽️" : "💡"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-brand uppercase">{i.category}</p>
                  <p className="truncate font-semibold">{i.title}</p>
                </div>
                <Pencil className="size-4 shrink-0 text-muted" />
              </Card>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <ItemForm
          draft={editing}
          categories={categories}
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

function ItemForm({ draft, categories, onClose, onSaved }: { draft: Draft; categories: string[]; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(draft.title ?? "");
  const [category, setCategory] = useState(draft.category ?? "");
  const [body, setBody] = useState(draft.body ?? "");
  const [image, setImage] = useState<string | null>(draft.image_url ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const noun = draft.kind === "recipe" ? "recipe" : "tip";

  async function save() {
    setError("");
    if (!title.trim()) return setError("Add a title.");
    setBusy(true);
    const row = { kind: draft.kind, title: title.trim(), category: category.trim() || "General", body: body.trim(), image_url: image };
    const sb = supabase().from("library_items");
    const { error } = draft.id ? await sb.update(row).eq("id", draft.id) : await sb.insert(row);
    setBusy(false);
    if (error) return setError(error.message);
    onSaved();
  }

  async function remove() {
    if (!draft.id || !confirm(`Delete this ${noun}?`)) return;
    await supabase().from("library_items").delete().eq("id", draft.id);
    onSaved();
  }

  return (
    <Sheet title={draft.id ? `Edit ${noun}` : `New ${noun}`} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-base" />
        </Field>
        <Field label="Category" hint="Pick one below or type a new one.">
          <Input value={category} onChange={(e) => setCategory(e.target.value)} className="text-base" />
        </Field>
        {categories.length > 0 && (
          <div className="-mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium ring-1", category === c ? "bg-ink text-bg ring-ink" : "ring-line")}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <Field label={draft.kind === "recipe" ? "Recipe" : "Tip"} hint={<FormattingHint />}>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="font-mono text-sm" />
        </Field>
        <ImageField value={image} onChange={setImage} folder="library" />
        <ErrorText>{error}</ErrorText>
        <Button className="w-full" onClick={save} loading={busy}>
          {draft.id ? "Save changes" : `Add ${noun}`}
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
