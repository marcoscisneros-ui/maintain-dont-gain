"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { DatePager } from "@/components/DatePager";
import { Ring } from "@/components/Ring";
import { useToast } from "@/components/Toast";
import { isMilestone, useCelebrate } from "@/components/Celebration";
import { Button, Card, Chip, Empty, ErrorText, Input, PageHeader, SectionTitle } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { todayISO } from "@/lib/dates";

type Meal = { id: number; name: string; calories: number; protein: number | null; carbs: number | null; fat: number | null };
const LABELS = ["Breakfast", "Lunch", "Dinner", "Snack"];

function defaultLabel() {
  const h = new Date().getHours();
  return h < 10 ? "Breakfast" : h < 15 ? "Lunch" : h < 21 ? "Dinner" : "Snack";
}

export default function FoodPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const celebrate = useCelebrate();
  const [date, setDate] = useState(todayISO());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [recent, setRecent] = useState<{ name: string; calories: number }[]>([]);
  const [label, setLabel] = useState(defaultLabel());
  const [desc, setDesc] = useState("");
  const [cal, setCal] = useState("");
  const [showMacros, setShowMacros] = useState(false);
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!profile) return;
    const sb = supabase();
    const [day, rec] = await Promise.all([
      sb.from("meals").select("id,name,calories,protein,carbs,fat").eq("user_id", profile.id).eq("date", date).order("created_at"),
      sb.from("meals").select("name,calories").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(40),
    ]);
    setMeals((day.data ?? []) as Meal[]);
    const seen = new Set<string>();
    setRecent(
      (rec.data ?? []).filter((m) => {
        const k = `${m.name}|${m.calories}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, 8),
    );
  }, [profile, date]);

  useEffect(() => {
    load();
  }, [load]);

  if (!profile) return null;
  const total = meals.reduce((s, m) => s + m.calories, 0);
  const left = profile.calorie_target - total;
  const macro = (k: "protein" | "carbs" | "fat") => meals.reduce((s, m) => s + (m[k] ?? 0), 0);
  const hasMacros = meals.some((m) => m.protein != null || m.carbs != null || m.fat != null);

  async function add(entry: { name: string; calories: number; protein?: number | null; carbs?: number | null; fat?: number | null }) {
    setError("");
    setBusy(true);
    const { error } = await supabase().from("meals").insert({ ...entry, date });
    setBusy(false);
    if (error) return setError("Couldn't save. Check your connection.");
    const total = await countMine("meals", profile!.id);
    const left = profile!.calorie_target - (meals.reduce((s, m) => s + m.calories, 0) + entry.calories);
    celebrate({
      kind: "apple",
      title: total === 1 ? "First meal logged!" : `Meal #${total} logged!`,
      subtitle: left >= 0 ? `${entry.calories} cal · ${left.toLocaleString()} left today` : `${entry.calories} cal · honest logging is winning`,
      milestone: isMilestone(total) && total > 1,
    });
    load();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const calories = Math.round(Number(cal));
    if (!(calories > 0 && calories < 10000)) return setError("Enter the calories.");
    await add({
      name: desc.trim() ? `${label}: ${desc.trim()}` : label,
      calories,
      protein: p ? Math.round(Number(p)) : null,
      carbs: c ? Math.round(Number(c)) : null,
      fat: f ? Math.round(Number(f)) : null,
    });
    setDesc("");
    setCal("");
    setP("");
    setC("");
    setF("");
  }

  async function remove(id: number) {
    setMeals((m) => m.filter((x) => x.id !== id));
    await supabase().from("meals").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4 pt-6">
      {toast.node}
      <PageHeader title="Food" subtitle="Quick and honest beats perfect." />
      <DatePager value={date} onChange={setDate} />

      <Card className="rise flex items-center gap-5">
        <Ring value={total} max={profile.calorie_target} color={left < 0 ? "var(--danger)" : "var(--brand)"} size={108} stroke={11}>
          <span className="text-2xl font-bold">{total.toLocaleString()}</span>
          <span className="text-[11px] text-muted">eaten</span>
        </Ring>
        <div className="flex-1">
          <p className="text-sm text-muted">Target {profile.calorie_target.toLocaleString()}</p>
          <p className={`text-2xl font-bold ${left < 0 ? "text-danger" : ""}`}>
            {Math.abs(left).toLocaleString()} {left < 0 ? "over" : "left"}
          </p>
          {hasMacros && (
            <p className="mt-1 text-sm text-muted">
              P {macro("protein")}g · C {macro("carbs")}g · F {macro("fat")}g
            </p>
          )}
        </div>
      </Card>

      <form onSubmit={submit}>
        <Card className="rise space-y-4" style={{ animationDelay: "40ms" }}>
          <SectionTitle>Add food</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {LABELS.map((l) => (
              <Chip key={l} selected={label === l} onClick={() => setLabel(l)}>
                {l}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_8rem] gap-3">
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What was it? (optional)" className="text-base" />
            <Input type="number" inputMode="numeric" value={cal} onChange={(e) => setCal(e.target.value)} placeholder="0" suffix="cal" />
          </div>
          {showMacros ? (
            <div className="fade grid grid-cols-3 gap-3">
              <Input type="number" inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} placeholder="Protein" suffix="g" className="text-base" />
              <Input type="number" inputMode="numeric" value={c} onChange={(e) => setC(e.target.value)} placeholder="Carbs" suffix="g" className="text-base" />
              <Input type="number" inputMode="numeric" value={f} onChange={(e) => setF(e.target.value)} placeholder="Fat" suffix="g" className="text-base" />
            </div>
          ) : (
            <button type="button" onClick={() => setShowMacros(true)} className="text-sm font-medium text-brand">
              + Add protein / carbs / fat
            </button>
          )}
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" loading={busy}>
            <Plus className="size-5" /> Log it
          </Button>
        </Card>
      </form>

      {recent.length > 0 && (
        <div className="rise" style={{ animationDelay: "80ms" }}>
          <p className="mb-2 text-sm font-medium text-muted">One-tap repeats</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {recent.map((r) => (
              <button
                key={`${r.name}|${r.calories}`}
                onClick={() => add({ name: r.name, calories: r.calories })}
                className="shrink-0 rounded-2xl bg-card px-4 py-2.5 text-left shadow-card ring-1 ring-line/60 active:scale-[0.97] transition"
              >
                <span className="block max-w-40 truncate text-sm font-medium">{r.name}</span>
                <span className="text-xs text-muted">{r.calories} cal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Card className="rise" style={{ animationDelay: "120ms" }}>
        <SectionTitle>Logged</SectionTitle>
        {meals.length === 0 ? (
          <Empty>Nothing logged for this day yet.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {meals.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.name}</p>
                  {(m.protein != null || m.carbs != null || m.fat != null) && (
                    <p className="text-xs text-muted">
                      P {m.protein ?? 0}g · C {m.carbs ?? 0}g · F {m.fat ?? 0}g
                    </p>
                  )}
                </div>
                <span className="font-semibold">{m.calories}</span>
                <button onClick={() => remove(m.id)} className="rounded-lg p-2 text-muted active:text-danger" aria-label="Delete">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

async function countMine(table: string, userId: string): Promise<number> {
  const { count } = await supabase().from(table).select("user_id", { count: "exact", head: true }).eq("user_id", userId);
  return count ?? 0;
}
