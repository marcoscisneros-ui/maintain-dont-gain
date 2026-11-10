"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Share2 } from "lucide-react";
import { Sheet } from "./Sheet";
import { Button, ButtonLink, Spinner } from "./ui";
import { renderTrophyJPG, type TrophyInfo } from "@/lib/trophy";

export type AwardSpec = { title: string; alt: string; fileName: string; shareTitle: string; shareText: string; render: () => Promise<Blob> };

export function trophySpec(info: TrophyInfo): AwardSpec {
  return {
    title: "🏆 Your trophy",
    alt: `${info.days}-Workout Week trophy for ${info.name}`,
    fileName: `mdg-trophy-week-${info.weekNo}.jpg`,
    shareTitle: `My ${info.days}-Workout Week trophy`,
    shareText: `${info.days} workouts this week! 🏆 #MaintainDontGain`,
    render: () => renderTrophyJPG(info),
  };
}

/** Preview of the shareable trophy picture, with Share / Save / open Facebook group. */
export function TrophySheet({ spec, facebookUrl, onClose }: { spec: AwardSpec; facebookUrl?: string; onClose: () => void }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const fileName = spec.fileName;

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    spec
      .render()
      .then((b) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch(() => setError("Couldn't create your trophy. Try again."));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.fileName]);

  const file = blob ? new File([blob], fileName, { type: "image/jpeg" }) : null;
  const canShare = !!file && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });

  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: spec.shareTitle, text: spec.shareText });
    } catch {
      /* closed the share sheet */
    }
  }

  function save() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMsg("Saved! On iPhone, if it opens instead, press and hold the picture and choose Save to Photos.");
  }

  return (
    <Sheet title={spec.title} onClose={onClose}>
      <div className="overflow-hidden rounded-2xl bg-card-2 ring-1 ring-line">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={spec.alt} className="w-full" />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center text-brand">{error || <Spinner className="size-8" />}</div>
        )}
      </div>
      <p className="mt-3 text-center text-sm text-muted">Post it in our Facebook group and inspire someone else to get their workout in!</p>
      <div className="mt-4 space-y-2">
        {canShare && (
          <Button className="w-full" onClick={share}>
            <Share2 className="size-5" /> Share (Facebook, texts…)
          </Button>
        )}
        <Button className="w-full" variant={canShare ? "secondary" : "primary"} onClick={save} disabled={!url}>
          <Download className="size-5" /> Save image
        </Button>
        {facebookUrl && (
          <ButtonLink href={facebookUrl} external variant="secondary" className="w-full">
            <ExternalLink className="size-5" /> Open our Facebook group
          </ButtonLink>
        )}
      </div>
      {msg && <p className="fade mt-3 text-center text-xs text-muted">{msg}</p>}
    </Sheet>
  );
}
