"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Download, Printer, Share2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button, Spinner } from "@/components/ui";
import { loadSettings } from "@/lib/settings";
import { formatDate } from "@/lib/dates";
import { renderPosterPNG } from "@/lib/poster";

/** Front-desk poster, made as a picture so it can be saved, shared, AirPrinted, or printed. */
export default function PosterPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (profile && !profile.is_admin) router.replace("/home");
  }, [profile, router]);

  useEffect(() => {
    let objectUrl: string | null = null;
    loadSettings(true)
      .then((s) =>
        renderPosterPNG({
          joinUrl: `${window.location.origin}/join`,
          dates: `${formatDate(s.start_date, { month: "short", day: "numeric" })} – ${formatDate(s.end_date, { month: "short", day: "numeric" })}`,
          joinCode: s.join_code || undefined,
        }),
      )
      .then((b) => {
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch(() => setError("Couldn't make the poster. Try reloading the page."));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  if (!profile?.is_admin) return null;
  const file = blob ? new File([blob], "maintain-dont-gain-poster.png", { type: "image/png" }) : null;
  const canShare = !!file && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });

  function save() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "maintain-dont-gain-poster.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMsg("Saved. On iPhone, if it opens instead, press and hold the poster and choose Save to Photos, then print it from Photos.");
  }

  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: "Maintain, Don't Gain poster" });
    } catch {}
  }

  return (
    <div className="pt-6 print:p-0">
      <div className="no-print">
        <button onClick={() => router.back()} className="-ml-2 flex items-center gap-1 text-sm font-medium text-muted">
          <ChevronLeft className="size-5" /> Back
        </button>
        <h1 className="mt-3 text-[28px] font-bold tracking-tight">Front-desk poster</h1>
        <p className="mt-1 text-sm text-muted">Letter size (8.5 × 11 in). Save it to your phone or computer, then print it, or share it straight to a printer, email or text.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {canShare ? (
            <Button onClick={share} disabled={!url}>
              <Share2 className="size-5" /> Share / AirPrint
            </Button>
          ) : (
            <Button onClick={() => window.print()} disabled={!url}>
              <Printer className="size-5" /> Print
            </Button>
          )}
          <Button variant="secondary" onClick={save} disabled={!url}>
            <Download className="size-5" /> Save image
          </Button>
        </div>
        {msg && <p className="fade mt-3 text-xs text-muted">{msg}</p>}
      </div>

      <div className="poster mt-4 overflow-hidden rounded-2xl bg-card-2 shadow-card ring-1 ring-line print:mt-0 print:rounded-none print:shadow-none print:ring-0">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Maintain, Don't Gain front-desk poster with a QR code to join" className="block w-full" />
        ) : (
          <div className="flex aspect-[8.5/11] items-center justify-center text-brand">{error || <Spinner className="size-8" />}</div>
        )}
      </div>
    </div>
  );
}
