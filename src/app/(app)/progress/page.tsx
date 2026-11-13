"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, FileImage, Lock, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { InBodyVouchers } from "@/components/Vouchers";
import { BlindWeightCard } from "@/components/BlindWeight";
import { lastChange, sinceStart } from "@/lib/blind";
import { useSettings } from "@/lib/settings";
import { useCelebrate } from "@/components/Celebration";
import { Button, Card, Empty, ErrorText, Field, Input, PageHeader, SectionTitle, Spinner, Toggle, cn } from "@/components/ui";
import { HeightInput, formatHeight, isValidHeight } from "@/components/HeightInput";
import { supabase } from "@/lib/supabase";
import { formatDate, todayISO } from "@/lib/dates";
import { removePrivate, signedUrls, uploadPrivate } from "@/lib/privatePhotos";

type Scan = {
  id: number;
  date: string;
  weight: number;
  body_fat_pct: number | null;
  smm: number | null;
  visceral_fat: number | null;
  photo_path: string | null;
};
type Photo = { id: number; date: string; path: string; note: string | null };

export default function ProgressPage() {
  const { profile, refreshProfile } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const toast = useToast();
  const settings = useSettings();
  const celebrate = useCelebrate();
  const [scans, setScans] = useState<Scan[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const sb = supabase();
    const [s, p] = await Promise.all([
      sb.from("inbody_scans").select("*").eq("user_id", profile.id).order("date").order("id"),
      sb.from("progress_photos").select("*").eq("user_id", profile.id).order("date").order("id"),
    ]);
    const sc = (s.data ?? []) as Scan[];
    const ph = (p.data ?? []) as Photo[];
    setScans(sc);
    setPhotos(ph);
    setUrls(await signedUrls([...ph.map((x) => x.path), ...sc.map((x) => x.photo_path ?? "")]));
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  if (!profile) return null;
  const blind = !!profile.blind_weight && !revealed;
  const first = scans[0];
  const latest = scans[scans.length - 1];

  async function addPhoto(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadPrivate(profile!.id, file, "progress");
      await supabase().from("progress_photos").insert({ date: todayISO(), path });
      toast.show("Photo saved 📸");
      await load();
    } catch {
      toast.show("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  async function deletePhoto(p: Photo) {
    if (!confirm("Delete this photo?")) return;
    await supabase().from("progress_photos").delete().eq("id", p.id);
    await removePrivate(p.path);
    load();
  }

  async function deleteScan(s: Scan) {
    if (!confirm(`Delete the ${formatDate(s.date)} weigh-in?`)) return;
    await supabase().from("inbody_scans").delete().eq("id", s.id);
    if (s.photo_path) await removePrivate(s.photo_path);
    load();
  }

  return (
    <div className="space-y-4 pt-6">
      {toast.node}
      <PageHeader title="Progress" subtitle="Holding steady is winning." />

      <BlindWeightCard profile={profile} scans={scans} revealed={revealed} onReveal={setRevealed} onChanged={refreshProfile} />

      {settings && <InBodyVouchers userId={profile.id} settings={settings} name={`${profile.first_name} ${profile.last_name}`} />}

      {/* Change from start */}
      <Card className="rise">
        <SectionTitle right={profile.height_in ? <span className="text-sm text-muted">Height {formatHeight(profile.height_in)}</span> : undefined}>Since your first weigh-in</SectionTitle>
        {!first ? (
          <Empty>Add your first weigh-in below.</Empty>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {blind ? (
                <div className="rounded-2xl bg-card-2 p-3">
                  <p className="text-xs text-muted">Weight</p>
                  <p className="mt-1 text-lg font-bold">{sinceStart(scans)?.emoji ?? "🙈"}</p>
                  <p className="text-[11px] text-muted">{sinceStart(scans)?.text ?? "Hidden"}</p>
                </div>
              ) : (
                <Delta label="Weight" unit="lbs" from={first.weight} to={latest.weight} goodWhen="down-or-flat" />
              )}
              <Delta label="Body fat" unit="%" from={firstOf(scans, "body_fat_pct")} to={latestOf(scans, "body_fat_pct")} goodWhen="down-or-flat" />
              <Delta label="Muscle (SMM)" unit="lbs" from={firstOf(scans, "smm")} to={latestOf(scans, "smm")} goodWhen="up-or-flat" />
              <Delta label="Visceral fat" unit="lvl" from={firstOf(scans, "visceral_fat")} to={latestOf(scans, "visceral_fat")} goodWhen="down-or-flat" />
            </div>
            {scans.length > 1 && <WeightChart scans={scans} />}
          </>
        )}
        <Button className="mt-4 w-full" variant={adding ? "secondary" : "primary"} onClick={() => setAdding(!adding)}>
          {adding ? "Cancel" : (<><Plus className="size-5" /> Add a weigh-in</>)}
        </Button>
        {adding && (
          <ScanForm
            userId={profile.id}
            needsHeight={profile.height_in == null}
            blind={blind}
            onSaved={() => {
              setAdding(false);
              celebrate({
                kind: "star",
                title: "Weigh-in logged!",
                subtitle: blind ? "Check your trend below. No numbers, just how it's going." : "Checking in is how you hold the line.",
              });
              refreshProfile();
              load();
            }}
          />
        )}
      </Card>

      {/* Scan history */}
      {scans.length > 0 && (
        <Card className="rise" style={{ animationDelay: "40ms" }}>
          <SectionTitle>Weigh-in history</SectionTitle>
          <ul className="divide-y divide-line">
            {[...scans].reverse().map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {blind ? (s === first ? "Starting weigh-in" : `Weigh-in ${lastChange(scans.slice(0, scans.indexOf(s) + 1))?.emoji ?? ""}`) : `${Number(s.weight).toFixed(1)} lbs`}
                    {s === first && <span className="ml-2 rounded-full bg-card-2 px-2 py-0.5 text-[11px] text-muted">start</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(s.date, { month: "short", day: "numeric", year: "numeric" })}
                    {s.body_fat_pct != null && ` · ${s.body_fat_pct}% BF`}
                    {s.smm != null && ` · ${s.smm} SMM`}
                    {s.visceral_fat != null && ` · visceral ${s.visceral_fat}`}
                  </p>
                </div>
                {s.photo_path && urls[s.photo_path] && (
                  <button onClick={() => setViewer(urls[s.photo_path!])} className="rounded-lg p-2 text-muted" aria-label="View printout">
                    <FileImage className="size-5" />
                  </button>
                )}
                <button onClick={() => deleteScan(s)} className="rounded-lg p-2 text-muted active:text-danger" aria-label="Delete">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Photos */}
      <Card className="rise" style={{ animationDelay: "80ms" }}>
        <SectionTitle
          right={
            <span className="flex items-center gap-1 text-xs text-muted">
              <Lock className="size-3" /> Only you &amp; staff
            </span>
          }
        >
          Progress photos
        </SectionTitle>

        {photos.length >= 2 && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[photos[0], photos[photos.length - 1]].map((p, i) => (
              <button key={p.id} onClick={() => urls[p.path] && setViewer(urls[p.path])} className="relative overflow-hidden rounded-2xl bg-card-2">
                {urls[p.path] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[p.path]} alt="" className="aspect-[3/4] w-full object-cover" />
                )}
                <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
                  {i === 0 ? "Before" : "Latest"} · {formatDate(p.date)}
                </span>
              </button>
            ))}
          </div>
        )}

        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {[...photos].reverse().map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-xl bg-card-2">
                <button className="block w-full" onClick={() => urls[p.path] && setViewer(urls[p.path])}>
                  {urls[p.path] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urls[p.path]} alt="" className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="aspect-square" />
                  )}
                </button>
                <span className="absolute bottom-1 left-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {formatDate(p.date)}
                </span>
                <button
                  onClick={() => deletePhoto(p)}
                  className="absolute top-1 right-1 rounded-full bg-black/55 p-1.5 text-white"
                  aria-label="Delete photo"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Optional, but future-you will love a &quot;before&quot; shot. Same spot, same lighting, once a week.</Empty>
        )}
        <input ref={photoInput} type="file" accept="image/*" hidden onChange={(e) => addPhoto(e.target.files?.[0])} />
        <Button variant="secondary" className="mt-4 w-full" onClick={() => photoInput.current?.click()} loading={uploading}>
          <Camera className="size-5" /> Add a photo
        </Button>
      </Card>

      {viewer && (
        <div className="fade fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setViewer(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewer} alt="" className="max-h-full max-w-full rounded-xl" />
          <button className="absolute top-4 right-4 rounded-full bg-white/15 p-2 text-white pt-safe" aria-label="Close">
            <X className="size-6" />
          </button>
        </div>
      )}
    </div>
  );
}

type Metric = "body_fat_pct" | "smm" | "visceral_fat";
function firstOf(scans: Scan[], k: Metric): number | null {
  return scans.find((s) => s[k] != null)?.[k] ?? null;
}
/** Latest reading — only counts if it's a later scan than the first one with that metric. */
function latestOf(scans: Scan[], k: Metric): number | null {
  const withK = scans.filter((s) => s[k] != null);
  return withK.length > 1 ? withK[withK.length - 1][k] : null;
}

function Delta({
  label,
  unit,
  from,
  to,
  goodWhen,
}: {
  label: string;
  unit: string;
  from: number | null;
  to: number | null;
  goodWhen: "down-or-flat" | "up-or-flat";
}) {
  if (from == null)
    return (
      <div className="rounded-2xl bg-card-2 p-3">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-lg font-bold text-muted">–</p>
      </div>
    );
  if (to == null)
    // only one reading so far: show it as the starting point
    return (
      <div className="rounded-2xl bg-card-2 p-3">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-lg font-bold">
          {Number(from).toFixed(1)} {unit}
        </p>
        <p className="text-[11px] text-muted">starting point</p>
      </div>
    );
  const d = Math.round((Number(to) - Number(from)) * 10) / 10;
  const good = goodWhen === "down-or-flat" ? d <= 0.5 : d >= -0.5;
  return (
    <div className="rounded-2xl bg-card-2 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 text-lg font-bold", good ? "text-accent" : "text-brand")}>
        {d > 0 ? "+" : ""}
        {d.toFixed(1)} {unit}
      </p>
      <p className="text-[11px] text-muted">
        {Number(from).toFixed(1)} → {Number(to).toFixed(1)}
      </p>
    </div>
  );
}

function WeightChart({ scans }: { scans: Scan[] }) {
  const W = 300,
    H = 90,
    P = 8;
  const ws = scans.map((s) => Number(s.weight));
  const start = ws[0];
  const min = Math.min(...ws, start - 2);
  const max = Math.max(...ws, start + 2);
  const x = (i: number) => P + (i / (ws.length - 1)) * (W - 2 * P);
  const y = (v: number) => P + (1 - (v - min) / (max - min)) * (H - 2 * P);
  const line = ws.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Weight over time">
        <line x1={P} x2={W - P} y1={y(start)} y2={y(start)} stroke="var(--line)" strokeDasharray="4 4" strokeWidth="1.5" />
        <path d={line} fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {ws.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="4" fill="var(--card)" stroke="var(--brand)" strokeWidth="2.5" />
        ))}
      </svg>
      <p className="text-center text-[11px] text-muted">Dashed line = your starting weight</p>
    </div>
  );
}

function ScanForm({ userId, needsHeight, blind, onSaved }: { userId: string; needsHeight: boolean; blind?: boolean; onSaved: () => void }) {
  const [date, setDate] = useState(todayISO());
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [showInBody, setShowInBody] = useState(false);
  const [bf, setBf] = useState("");
  const [smm, setSmm] = useState("");
  const [visceral, setVisceral] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function save() {
    setError("");
    if (needsHeight && !isValidHeight(height)) return setError("Enter your height in feet and inches.");
    const w = Number(weight);
    if (!(w > 60 && w < 700)) return setError("Enter your weight in pounds.");
    setBusy(true);
    try {
      if (needsHeight) {
        const { error } = await supabase().from("profiles").update({ height_in: Number(height) }).eq("id", userId);
        if (error) throw error;
      }
      const photo_path = showInBody && file ? await uploadPrivate(userId, file, "inbody") : null;
      const { error } = await supabase()
        .from("inbody_scans")
        .insert({
          date,
          weight: w,
          body_fat_pct: showInBody && bf ? Number(bf) : null,
          smm: showInBody && smm ? Number(smm) : null,
          visceral_fat: showInBody && visceral ? Number(visceral) : null,
          photo_path,
        });
      if (error) throw error;
      onSaved();
    } catch {
      setError("Couldn't save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade mt-4 space-y-4 border-t border-line pt-4">
      {needsHeight && (
        <Field label="Your height (we only ask once)">
          <HeightInput value={height} onChange={setHeight} />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label={blind ? "Weight (hidden)" : "Weight"} hint={blind ? "Hand your phone to staff or a friend to type it." : undefined}>
          <Input
            type={blind ? "password" : "number"}
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ""))}
            suffix="lbs"
            autoFocus
          />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="text-base" />
        </Field>
      </div>

      <div className="rounded-2xl bg-card-2 p-4">
        <Toggle checked={showInBody} onChange={setShowInBody} label="Add InBody results (optional)" />
        {showInBody && (
          <div className="fade mt-4 space-y-4">
            <p className="text-xs text-muted">Fill in any of these from your InBody printout, or just snap a photo of it.</p>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Body fat">
                <Input type="number" inputMode="decimal" value={bf} onChange={(e) => setBf(e.target.value)} suffix="%" className="px-3 pr-9 text-base" />
              </Field>
              <Field label="SMM">
                <Input type="number" inputMode="decimal" value={smm} onChange={(e) => setSmm(e.target.value)} suffix="lbs" className="px-3 pr-10 text-base" />
              </Field>
              <Field label="Visceral fat">
                <Input type="number" inputMode="decimal" value={visceral} onChange={(e) => setVisceral(e.target.value)} placeholder="lvl" className="px-3 text-base" />
              </Field>
            </div>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line bg-card px-4 py-3 text-left text-sm text-muted"
            >
              <FileImage className="size-5" />
              {file ? <span className="truncate text-ink">{file.name}</span> : "Photo of your InBody printout (optional)"}
            </button>
          </div>
        )}
      </div>

      <ErrorText>{error}</ErrorText>
      <Button className="w-full" onClick={save} loading={busy}>
        {busy ? <Spinner /> : "Save weigh-in"}
      </Button>
    </div>
  );
}
