"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChefHat, Lightbulb, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { RichText } from "@/components/RichText";
import { Chip, Empty, PageHeader, cn } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { LibraryItem } from "@/lib/content";

export default function LibraryPage() {
  const router = useRouter();
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [kind, setKind] = useState<"recipe" | "tip">("recipe");
  const [cat, setCat] = useState<string>("All");
  const [open, setOpen] = useState<LibraryItem | null>(null);

  useEffect(() => {
    supabase()
      .from("library_items")
      .select("*")
      .order("category")
      .order("created_at")
      .then(({ data }) => setItems((data ?? []) as LibraryItem[]));
  }, []);

  const ofKind = useMemo(() => (items ?? []).filter((i) => i.kind === kind), [items, kind]);
  const cats = useMemo(() => ["All", ...Array.from(new Set(ofKind.map((i) => i.category)))], [ofKind]);
  const shown = cat === "All" ? ofKind : ofKind.filter((i) => i.category === cat);

  return (
    <div className="space-y-4 pt-6">
      <button onClick={() => router.back()} className="-ml-2 flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft className="size-5" /> Back
      </button>
      <PageHeader title="Recipes & Tips" subtitle="Easy, real food and tricks that work." />

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card-2 p-1 ring-1 ring-line">
        {(["recipe", "tip"] as const).map((k) => (
          <button
            key={k}
            onClick={() => {
              setKind(k);
              setCat("All");
            }}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition",
              kind === k ? "bg-card text-ink shadow-card" : "text-muted",
            )}
          >
            {k === "recipe" ? <ChefHat className="size-4" /> : <Lightbulb className="size-4" />}
            {k === "recipe" ? "Recipes" : "Tips & tricks"}
          </button>
        ))}
      </div>

      {cats.length > 2 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {cats.map((c) => (
            <Chip key={c} selected={cat === c} onClick={() => setCat(c)} className="shrink-0">
              {c}
            </Chip>
          ))}
        </div>
      )}

      {!items ? (
        <div className="h-48 animate-pulse rounded-3xl bg-card" />
      ) : shown.length === 0 ? (
        <Empty>Nothing here yet. Check back soon!</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {shown.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setOpen(item)}
              className="rise flex overflow-hidden rounded-3xl bg-card text-left shadow-card ring-1 ring-line/60 transition active:scale-[0.99]"
              style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt="" className="w-28 shrink-0 object-cover" />
              ) : (
                <div className="flex w-20 shrink-0 items-center justify-center bg-brand/8 text-3xl">
                  {item.kind === "recipe" ? emojiFor(item.category) : "💡"}
                </div>
              )}
              <div className="min-w-0 flex-1 p-4">
                <p className="text-xs font-semibold tracking-wide text-brand uppercase">{item.category}</p>
                <p className="mt-0.5 font-semibold leading-snug">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{preview(item.body)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="pop max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-card pb-safe"
          >
            {open.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.image_url} alt="" className="max-h-64 w-full object-cover" />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-brand uppercase">{open.category}</p>
                  <h2 className="mt-1 text-2xl leading-tight font-bold">{open.title}</h2>
                </div>
                <button onClick={() => setOpen(null)} className="-mr-2 rounded-full p-2 text-muted" aria-label="Close">
                  <X className="size-6" />
                </button>
              </div>
              <RichText text={open.body} className="mt-4 text-[15px]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function preview(body: string) {
  return body
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("## "))
    .map((l) => l.replace(/^[-•]\s|^\d+\.\s|\*\*/g, ""))
    .join(" · ")
    .slice(0, 140);
}

function emojiFor(category: string) {
  const c = category.toLowerCase();
  if (c.includes("breakfast")) return "🍳";
  if (c.includes("drink")) return "🥤";
  if (c.includes("snack")) return "🥕";
  if (c.includes("holiday")) return "🦃";
  return "🍽️";
}
