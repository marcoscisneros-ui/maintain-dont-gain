"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button, Card, Chip, Empty, ErrorText, Input, Toggle, cn } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { fetchAll } from "@/lib/admin";
import { formatDate } from "@/lib/dates";
import { timeAgo } from "@/lib/content";
import { prizeShare, type Prize, type Spin } from "@/lib/rewards";

/** Front desk: look up a certificate code, mark prizes redeemed, and set up the wheel. */
export function Rewards() {
  const { profile: me } = useAuth();
  const [spins, setSpins] = useState<Spin[] | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [q, setQ] = useState("");
  const [view, setView] = useState<"waiting" | "redeemed">("waiting");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, p, people] = await Promise.all([
        fetchAll<Spin>("spins", "*", "id"),
        fetchAll<Prize>("prizes", "id,name,weight,active,slots,emoji,short_name", "id"),
        fetchAll<{ id: string; first_name: string; last_name: string }>("profiles", "id,first_name,last_name", "created_at"),
      ]);
      setSpins(s.reverse());
      setPrizes(p);
      setNames(new Map(people.map((x) => [x.id, `${x.first_name} ${x.last_name}`])));
    } catch {
      setError("Couldn't load rewards. Has 06_rewards.sql been run in Supabase?");
      setSpins([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const query = q.trim().toUpperCase().replace(/^MDG-?/, "");
  const shown = useMemo(() => {
    const list = (spins ?? []).filter((s) => (view === "waiting" ? !s.redeemed_at : !!s.redeemed_at));
    if (!query) return list;
    return (spins ?? []).filter(
      (s) => s.code.includes(query) || (names.get(s.user_id) ?? "").toUpperCase().includes(query),
    );
  }, [spins, view, query, names]);

  async function redeem(s: Spin, undo = false) {
    setBusy(s.id);
    const { error } = await supabase()
      .from("spins")
      .update(undo ? { redeemed_at: null, redeemed_by: null } : { redeemed_at: new Date().toISOString(), redeemed_by: me?.id })
      .eq("id", s.id);
    setBusy(null);
    if (error) return setError(error.message);
    load();
  }

  const waiting = (spins ?? []).filter((s) => !s.redeemed_at).length;

  return (
    <div className="space-y-4">
      <ErrorText>{error}</ErrorText>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Certificate code or name"
          className="pl-10 font-mono text-base uppercase"
          autoCapitalize="characters"
          autoCorrect="off"
        />
      </div>

      {!query && (
        <div className="flex gap-2">
          <Chip selected={view === "waiting"} onClick={() => setView("waiting")}>
            Waiting to claim ({waiting})
          </Chip>
          <Chip selected={view === "redeemed"} onClick={() => setView("redeemed")}>
            Redeemed ({(spins ?? []).length - waiting})
          </Chip>
        </div>
      )}

      {!spins ? (
        <div className="h-40 animate-pulse rounded-3xl bg-card" />
      ) : shown.length === 0 ? (
        <Empty>{query ? "No certificate matches that." : view === "waiting" ? "No prizes waiting to be claimed." : "Nothing redeemed yet."}</Empty>
      ) : (
        <div className="space-y-2">
          {shown.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{prizes.find((p) => p.id === s.prize_id)?.emoji ?? "🎁"}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.prize_name}</p>
                  <p className="text-sm">{names.get(s.user_id) ?? "Member"}</p>
                  <p className="text-xs text-muted">
                    <span className="font-mono font-bold text-ink">{s.code}</span> · week of {formatDate(s.week_start)} · won {timeAgo(s.created_at)}
                  </p>
                </div>
              </div>
              {s.redeemed_at ? (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-accent">✓ Redeemed {timeAgo(s.redeemed_at)}</span>
                  <button onClick={() => redeem(s, true)} className="text-xs text-muted underline" disabled={busy === s.id}>
                    Undo
                  </button>
                </div>
              ) : (
                <Button className="mt-3 w-full" onClick={() => redeem(s)} loading={busy === s.id}>
                  <Check className="size-5" /> Mark redeemed
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <PrizeEditor prizes={prizes} onChanged={load} />
    </div>
  );
}

function PrizeEditor({ prizes, onChanged }: { prizes: Prize[]; onChanged: () => void }) {
  const [adding, setAdding] = useState({ name: "", short_name: "", emoji: "🎁", slots: "1", weight: "5" });
  const [error, setError] = useState("");
  const total = prizes.reduce((s, p) => s + prizeShare(p), 0);
  const sb = () => supabase().from("prizes");

  async function add() {
    setError("");
    if (!adding.name.trim()) return setError("Name the prize.");
    const { error } = await sb().insert({
      name: adding.name.trim(),
      short_name: adding.short_name.trim() || null,
      emoji: adding.emoji.trim() || "🎁",
      slots: Math.min(6, Math.max(1, Number(adding.slots) || 1)),
      weight: Math.max(0, Number(adding.weight) || 0),
    });
    if (error) return setError(error.message);
    setAdding({ name: "", short_name: "", emoji: "🎁", slots: "1", weight: "5" });
    onChanged();
  }
  async function update(p: Prize, patch: Partial<Prize>) {
    const { error } = await sb().update(patch).eq("id", p.id);
    if (error) setError(error.message);
    onChanged();
  }
  async function remove(p: Prize) {
    if (!confirm(`Remove "${p.name}" from the wheel? Certificates already won stay valid.`)) return;
    await sb().delete().eq("id", p.id);
    onChanged();
  }

  const small = "h-10 rounded-xl bg-card-2 text-center ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="font-semibold">Prizes on the wheel</h3>
        <p className="text-xs text-muted">
          <b>Times</b> = how many slices it gets around the wheel. <b>Size</b> = how wide each slice is. The chance shown is exactly how much of the wheel it covers.
        </p>
      </div>
      <ul className="divide-y divide-line">
        {[...prizes]
          .sort((a, b) => prizeShare(b) - prizeShare(a))
          .map((p) => (
            <li key={p.id} className={cn("space-y-2 py-3", !p.active && "opacity-50")}>
              <div className="flex items-center gap-2">
                <input
                  defaultValue={p.emoji ?? "🎁"}
                  aria-label={`Emoji for ${p.name}`}
                  onBlur={(e) => e.target.value !== p.emoji && update(p, { emoji: e.target.value.trim() || "🎁" })}
                  className={cn(small, "w-11 text-xl")}
                />
                <div className="min-w-0 flex-1">
                  <input
                    defaultValue={p.name}
                    aria-label="Prize name"
                    onBlur={(e) => e.target.value.trim() && e.target.value !== p.name && update(p, { name: e.target.value.trim() })}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                  />
                  <input
                    defaultValue={p.short_name ?? ""}
                    placeholder="Short wheel label (optional)"
                    aria-label="Wheel label"
                    onBlur={(e) => e.target.value !== (p.short_name ?? "") && update(p, { short_name: e.target.value.trim() || null })}
                    className="w-full bg-transparent text-xs text-muted outline-none"
                  />
                </div>
                <span className="w-12 text-right text-sm font-bold">{p.active && total ? `${((prizeShare(p) / total) * 100).toFixed(0)}%` : "off"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <label className="flex items-center gap-1">
                  Times
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={6}
                    defaultValue={p.slots ?? 1}
                    onBlur={(e) => Number(e.target.value) !== p.slots && update(p, { slots: Math.min(6, Math.max(1, Number(e.target.value) || 1)) })}
                    className={cn(small, "w-12 text-sm text-ink")}
                  />
                </label>
                <label className="flex items-center gap-1">
                  Size
                  <input
                    type="number"
                    inputMode="numeric"
                    defaultValue={p.weight}
                    onBlur={(e) => Number(e.target.value) !== p.weight && update(p, { weight: Math.max(0, Number(e.target.value) || 0) })}
                    className={cn(small, "w-14 text-sm text-ink")}
                  />
                </label>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-12">
                    <Toggle checked={p.active} onChange={(v) => update(p, { active: v })} label="" />
                  </div>
                  <button onClick={() => remove(p)} className="p-2" aria-label={`Remove ${p.name}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
      </ul>
      <div className="space-y-2 rounded-2xl bg-card-2 p-3">
        <p className="text-sm font-semibold">Add a prize</p>
        <div className="flex gap-2">
          <input value={adding.emoji} onChange={(e) => setAdding({ ...adding, emoji: e.target.value })} aria-label="Emoji" className={cn(small, "w-12 bg-card text-xl")} />
          <Input value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} placeholder="Prize name" className="bg-card text-base" />
        </div>
        <Input value={adding.short_name} onChange={(e) => setAdding({ ...adding, short_name: e.target.value })} placeholder="Short wheel label (optional)" className="h-10 bg-card text-sm" />
        <div className="flex items-center justify-end gap-2 text-xs text-muted">
          Times
          <input type="number" value={adding.slots} onChange={(e) => setAdding({ ...adding, slots: e.target.value })} className={cn(small, "w-12 bg-card text-sm text-ink")} />
          Size
          <input type="number" value={adding.weight} onChange={(e) => setAdding({ ...adding, weight: e.target.value })} className={cn(small, "w-12 bg-card text-sm text-ink")} />
          <Button onClick={add} className="min-h-10 px-3" aria-label="Add prize">
            <Plus className="size-5" />
          </Button>
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
    </Card>
  );
}
