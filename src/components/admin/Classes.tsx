"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { StarRating } from "@/components/StarRating";
import { Card, Chip, Empty } from "@/components/ui";
import { fetchAll } from "@/lib/admin";
import { addDays, formatDate, todayISO } from "@/lib/dates";

type Row = { id: number; user_id: string; date: string; location: "class" | "pt"; activity: string; rating: number | null; notes: string | null };
type Group = { name: string; kind: "class" | "pt"; count: number; rated: number; avg: number | null; rows: Row[] };

/** Which classes people take, how they rate them, and what they say. */
export function Classes() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [range, setRange] = useState<"all" | "7">("all");
  const [open, setOpen] = useState<Group | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAll<Row & { location: string }>("workouts", "id,user_id,date,location,activity,rating,notes", "id"),
      fetchAll<{ id: string; first_name: string; last_name: string }>("profiles", "id,first_name,last_name", "created_at"),
    ]).then(([w, p]) => {
      setRows(w.filter((x) => x.location === "class" || x.location === "pt") as Row[]);
      setNames(new Map(p.map((x) => [x.id, `${x.first_name} ${x.last_name.slice(0, 1)}.`])));
    });
  }, []);

  const groups = useMemo(() => {
    if (!rows) return [];
    const since = addDays(todayISO(), -6); // last 7 days in San Angelo time
    const m = new Map<string, Group>();
    for (const r of rows) {
      if (range === "7" && r.date < since) continue;
      const key = r.location === "pt" ? "Personal training" : r.activity.trim() || "Class";
      const g = m.get(key) ?? { name: key, kind: r.location, count: 0, rated: 0, avg: null, rows: [] };
      g.count++;
      g.rows.push(r);
      if (r.rating) {
        g.avg = ((g.avg ?? 0) * g.rated + r.rating) / (g.rated + 1);
        g.rated++;
      }
      m.set(key, g);
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [rows, range]);

  if (!rows) return <div className="h-64 animate-pulse rounded-3xl bg-card" />;
  const total = groups.reduce((s, g) => s + g.count, 0);
  const allRated = groups.flatMap((g) => g.rows.filter((r) => r.rating));
  const overall = allRated.length ? allRated.reduce((s, r) => s + r.rating!, 0) / allRated.length : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Chip selected={range === "all"} onClick={() => setRange("all")}>
          Whole challenge
        </Chip>
        <Chip selected={range === "7"} onClick={() => setRange("7")}>
          Last 7 days
        </Chip>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card className="p-4">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-sm font-medium">classes & PT logged</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1 text-2xl font-bold">
            {overall ? overall.toFixed(1) : "–"} <Star className="size-5 fill-gold text-gold" strokeWidth={0} />
          </p>
          <p className="text-sm font-medium">average rating</p>
          <p className="text-xs text-muted">{allRated.length} ratings</p>
        </Card>
      </div>

      {groups.length === 0 ? (
        <Empty>No classes logged yet. When members log a class or personal training session, it shows up here.</Empty>
      ) : (
        <Card className="p-2">
          <ul className="divide-y divide-line">
            {groups.map((g) => (
              <li key={g.name}>
                <button onClick={() => setOpen(g)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left active:bg-card-2">
                  <span className="text-xl">{g.kind === "pt" ? "🤝" : "🔥"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{g.name}</p>
                    <p className="text-xs text-muted">
                      {g.count} logged · {g.rated} rating{g.rated === 1 ? "" : "s"} · {plural(g.rows.filter((r) => r.notes).length, "comment")}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 font-bold">
                    {g.avg ? g.avg.toFixed(1) : "–"}
                    <Star className="size-4 fill-gold text-gold" strokeWidth={0} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {open && (
        <Sheet title={open.name} onClose={() => setOpen(null)}>
          <p className="mb-4 text-sm text-muted">
            {open.count} logged · average {open.avg ? open.avg.toFixed(1) : "–"} ★ from {open.rated} rating{open.rated === 1 ? "" : "s"}
          </p>
          <ul className="space-y-3">
            {[...open.rows]
              .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
              .map((r) => (
                <li key={r.id} className="rounded-2xl bg-card-2 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {names.get(r.user_id) ?? "Member"} <span className="font-normal text-muted">· {formatDate(r.date)}</span>
                    </p>
                    {r.rating ? <StarRating value={r.rating} size={14} /> : <span className="text-xs text-muted">no rating</span>}
                  </div>
                  {r.notes && <p className="mt-1 text-sm">&ldquo;{r.notes}&rdquo;</p>}
                </li>
              ))}
          </ul>
        </Sheet>
      )}
    </div>
  );
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
