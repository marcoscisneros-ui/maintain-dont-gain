"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Flame, KeyRound, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import { Sheet } from "@/components/Sheet";
import { Button, Card, Chip, Empty, ErrorText, Input, cn } from "@/components/ui";
import { PinInput } from "@/components/PinInput";
import { formatHeight } from "@/components/HeightInput";
import { useSettings } from "@/lib/settings";
import { formatDate, todayISO } from "@/lib/dates";
import { timeAgo } from "@/lib/content";
import { signedUrls } from "@/lib/privatePhotos";
import { supabase } from "@/lib/supabase";
import {
  adminAction,
  computeStats,
  downloadCSV,
  loadAllData,
  logsCSV,
  summaryCSV,
  type AllData,
  type MemberStats,
} from "@/lib/admin";

type SortKey = "points" | "streak" | "days" | "weight" | "recent" | "name";
const SORTS: { id: SortKey; label: string }[] = [
  { id: "points", label: "Points" },
  { id: "streak", label: "Streak" },
  { id: "days", label: "Days logged" },
  { id: "weight", label: "Weight change" },
  { id: "recent", label: "Last seen" },
  { id: "name", label: "Name" },
];

export function Members() {
  const settings = useSettings();
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<SortKey>("points");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<MemberStats | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await loadAllData());
    } catch {
      setError("Couldn't load members. Pull to refresh or try again.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => (data && settings ? computeStats(data, settings) : []), [data, settings]);

  const shown = useMemo(() => {
    const s = stats.filter((m) =>
      `${m.profile.first_name} ${m.profile.last_name} ${m.profile.username}`.toLowerCase().includes(q.toLowerCase()),
    );
    const cmp: Record<SortKey, (a: MemberStats, b: MemberStats) => number> = {
      points: (a, b) => b.points - a.points || b.daysLogged - a.daysLogged,
      streak: (a, b) => b.streak - a.streak,
      days: (a, b) => b.daysLogged - a.daysLogged,
      weight: (a, b) => (a.weightChange ?? 999) - (b.weightChange ?? 999),
      recent: (a, b) => b.profile.last_seen_at.localeCompare(a.profile.last_seen_at),
      name: (a, b) => a.profile.first_name.localeCompare(b.profile.first_name),
    };
    return s.sort(cmp[sort]);
  }, [stats, sort, q]);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data || !settings) return <div className="h-64 animate-pulse rounded-3xl bg-card" />;

  const today = todayISO();
  const activeToday = stats.filter((s) => s.loggedToday).length;
  const seenToday = stats.filter((s) => s.profile.last_seen_at.slice(0, 10) >= today).length;
  const holding = stats.filter((s) => s.weightChange != null && s.weightChange <= 1).length;
  const withScans = stats.filter((s) => s.weightChange != null).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Members" value={stats.length} />
        <Stat label="Logged today" value={activeToday} sub={`${seenToday} opened the app`} />
        <Stat label="Total workouts" value={data.workouts.length} />
        <Stat label="Holding steady" value={withScans ? `${holding}/${withScans}` : "–"} sub="within 1 lb of start" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" className="text-sm" onClick={() => downloadCSV(`mdg-participants-${today}.csv`, summaryCSV(shown))}>
          <Download className="size-4" /> Summary CSV
        </Button>
        <Button variant="secondary" className="text-sm" onClick={() => downloadCSV(`mdg-all-logs-${today}.csv`, logsCSV(data))}>
          <Download className="size-4" /> All logs CSV
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" className="pl-10 text-base" />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {SORTS.map((s) => (
          <Chip key={s.id} selected={sort === s.id} onClick={() => setSort(s.id)} className="shrink-0">
            {s.label}
          </Chip>
        ))}
        <button onClick={load} className="flex shrink-0 items-center gap-1 px-3 text-sm text-muted" aria-label="Refresh">
          <RefreshCw className="size-4" />
        </button>
      </div>

      {shown.length === 0 ? (
        <Empty>No members yet. Share the link!</Empty>
      ) : (
        <Card className="p-2">
          <ul className="divide-y divide-line">
            {shown.map((m, i) => (
              <li key={m.profile.id}>
                <button onClick={() => setOpen(m)} className="flex w-full items-center gap-3 px-2 py-3 text-left active:bg-card-2 rounded-2xl">
                  <span className="w-5 text-center text-sm font-bold text-muted">{i + 1}</span>
                  <Avatar url={m.profile.avatar_url} name={`${m.profile.first_name} ${m.profile.last_name}`} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {m.profile.first_name} {m.profile.last_name}
                      {m.profile.is_admin && <ShieldCheck className="ml-1 inline size-4 text-violet" />}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {m.daysLogged}d logged ·{" "}
                      <span className={m.streak >= 3 ? "font-semibold text-brand" : ""}>
                        {m.streak > 0 && <Flame className="inline size-3" />} {m.streak} streak
                      </span>{" "}
                      · seen {timeAgo(m.profile.last_seen_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{m.points} pts</p>
                    <WeightBadge v={m.weightChange} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {open && (
        <MemberSheet
          m={open}
          onClose={() => setOpen(null)}
          onChanged={() => {
            setOpen(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </Card>
  );
}

function WeightBadge({ v }: { v: number | null }) {
  if (v == null) return <p className="text-xs text-muted">no re-scan</p>;
  return (
    <p className={cn("text-xs font-semibold", v <= 1 ? "text-accent" : "text-brand")}>
      {v > 0 ? "+" : ""}
      {v.toFixed(1)} lbs
    </p>
  );
}

function MemberSheet({ m, onClose, onChanged }: { m: MemberStats; onClose: () => void; onChanged: () => void }) {
  const { profile: me } = useAuth();
  const p = m.profile;
  const name = `${p.first_name} ${p.last_name}`;
  const [photos, setPhotos] = useState<{ id: number; date: string; url: string }[]>([]);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase()
      .from("progress_photos")
      .select("id,date,path")
      .eq("user_id", p.id)
      .order("date")
      .then(async ({ data }) => {
        const rows = data ?? [];
        const urls = await signedUrls(rows.map((r) => r.path));
        setPhotos(rows.map((r) => ({ id: r.id, date: r.date, url: urls[r.path] })).filter((r) => r.url));
      });
  }, [p.id, m.scans]);

  async function run(label: string, fn: () => Promise<void>, done: string, reload = false) {
    setBusy(label);
    setErr("");
    setMsg("");
    try {
      await fn();
      setMsg(done);
      if (reload) setTimeout(onChanged, 900);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Sheet title={name} onClose={onClose}>
      <div className="flex items-center gap-4">
        <Avatar url={p.avatar_url} name={name} size={64} />
        <div>
          <p className="text-lg font-bold">{name}</p>
          <p className="text-sm text-muted">
            {p.username} · joined {formatDate(p.created_at.slice(0, 10))}
            {p.height_in ? ` · ${formatHeight(p.height_in)}` : ""}
          </p>
          <p className="text-sm text-muted">Last seen {timeAgo(p.last_seen_at)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 text-center">
        {[
          [m.points, "points"],
          [m.workouts, "workouts"],
          [m.daysLogged, "days"],
          [m.streak, "streak"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl bg-card-2 py-3">
            <p className="text-xl font-bold">{v}</p>
            <p className="text-[11px] text-muted">{l}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-6 mb-2 font-semibold">Weigh-ins & InBody</h3>
      {m.scans.length === 0 ? (
        <Empty>No scans yet.</Empty>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-4 gap-2 text-center text-sm">
            <Change label="Weight" v={m.weightChange} unit="lb" goodDown />
            <Change label="Body fat" v={m.bodyFatChange} unit="%" goodDown />
            <Change label="SMM" v={m.smmChange} unit="lb" />
            <Change label="Visceral" v={m.visceralChange} unit="lvl" goodDown />
          </div>
          <ul className="divide-y divide-line rounded-2xl bg-card-2 px-4 text-sm">
            {[...m.scans].reverse().map((s) => (
              <li key={s.id} className="flex justify-between py-2.5">
                <span className="text-muted">{formatDate(s.date, { month: "short", day: "numeric", year: "numeric" })}</span>
                <span>
                  <b>{Number(s.weight).toFixed(1)}</b> lbs
                  {s.body_fat_pct != null && ` · ${s.body_fat_pct}%`}
                  {s.smm != null && ` · ${s.smm} SMM`}
                  {s.visceral_fat != null && ` · V${s.visceral_fat}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {photos.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 font-semibold">Progress photos</h3>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((ph) => (
              <a key={ph.id} href={ph.url} target="_blank" rel="noopener noreferrer" className="relative overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.url} alt="" className="aspect-square w-full object-cover" />
                <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 text-[10px] text-white">{formatDate(ph.date)}</span>
              </a>
            ))}
          </div>
        </>
      )}

      <h3 className="mt-6 mb-2 font-semibold">Reset PIN</h3>
      <p className="mb-3 text-sm text-muted">Type a new 4-digit PIN, then tell {p.first_name} what it is.</p>
      <PinInput value={pin} onChange={setPin} />
      <Button
        variant="secondary"
        className="mt-3 w-full"
        disabled={pin.length !== 4}
        loading={busy === "pin"}
        onClick={() => run("pin", () => adminAction("reset_pin", p.id, { pin }), `PIN reset. ${p.first_name}'s new PIN is ${pin}.`)}
      >
        <KeyRound className="size-4" /> Set new PIN
      </Button>

      <h3 className="mt-6 mb-2 font-semibold">Access</h3>
      <div className="space-y-2">
        <Button
          variant="secondary"
          className="w-full"
          loading={busy === "admin"}
          disabled={p.id === me?.id}
          onClick={() =>
            run(
              "admin",
              () => adminAction("set_admin", p.id, { value: !p.is_admin }),
              p.is_admin ? "Admin access removed." : `${p.first_name} is now an admin.`,
              true,
            )
          }
        >
          <ShieldCheck className="size-4" /> {p.is_admin ? "Remove admin access" : "Make admin (staff)"}
        </Button>
        {p.id !== me?.id && (
          <Button
            variant="danger"
            className="w-full"
            loading={busy === "delete"}
            onClick={() => {
              if (!confirm(`Remove ${name} and ALL of their logs and photos? This can't be undone.`)) return;
              run("delete", () => adminAction("delete_member", p.id), "Member removed.", true);
            }}
          >
            <Trash2 className="size-4" /> Remove member
          </Button>
        )}
      </div>
      {msg && <p className="fade mt-4 rounded-xl bg-accent/12 px-4 py-3 text-sm font-medium text-accent">{msg}</p>}
      <div className="mt-3">
        <ErrorText>{err}</ErrorText>
      </div>
    </Sheet>
  );
}

function Change({ label, v, unit, goodDown }: { label: string; v: number | null; unit: string; goodDown?: boolean }) {
  const good = v == null ? null : goodDown ? v <= 0.5 : v >= -0.5;
  return (
    <div className="rounded-2xl bg-card-2 py-2">
      <p className={cn("font-bold", good == null ? "text-muted" : good ? "text-accent" : "text-brand")}>
        {v == null ? "–" : `${v > 0 ? "+" : ""}${v.toFixed(1)}`}
        {v != null && <span className="text-[10px]"> {unit}</span>}
      </p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
