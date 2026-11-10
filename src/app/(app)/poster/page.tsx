"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ChevronLeft, Printer } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { JingleBells } from "@/components/Seasonal";
import { Button } from "@/components/ui";
import { loadSettings, type Settings } from "@/lib/settings";
import { formatDate } from "@/lib/dates";

/** Printable front-desk sign: QR code to the join page + how to add the app to your home screen. */
export default function PosterPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [qr, setQr] = useState("");
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    if (profile && !profile.is_admin) router.replace("/home");
  }, [profile, router]);

  useEffect(() => {
    loadSettings(true).then(setSettings); // admins also get the join code
    const url = `${window.location.origin}/join`;
    setJoinUrl(url);
    QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1d1a17", light: "#ffffff" } }).then(setQr);
  }, []);

  if (!profile?.is_admin || !settings) return null;
  const dates = `${formatDate(settings.start_date, { month: "short", day: "numeric" })} – ${formatDate(settings.end_date, { month: "short", day: "numeric" })}`;

  return (
    <div className="pt-6 print:p-0">
      <div className="no-print mb-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="-ml-2 flex items-center gap-1 text-sm font-medium text-muted">
          <ChevronLeft className="size-5" /> Back
        </button>
        <Button onClick={() => window.print()} className="px-4 text-sm">
          <Printer className="size-4" /> Print
        </Button>
      </div>
      <p className="no-print mb-4 text-sm text-muted">
        Prints on one letter-size page. In the print dialog, turn on <b>Background graphics</b> for the colors. On a phone you can also screenshot it.
      </p>

      <article className="poster relative mx-auto flex aspect-[8.5/11] w-full flex-col overflow-hidden rounded-2xl bg-[#fbf7f0] text-[#1d1a17] shadow-card print:rounded-none print:shadow-none">
        {/* header band */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#c8283f] via-[#d9452f] to-[#e8762c] px-[6%] pt-[6%] pb-[7%] text-center text-white">
          {Array.from({ length: 26 }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute text-white/40"
              style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, fontSize: `${8 + (i % 4) * 4}px` }}
            >
              ❄
            </span>
          ))}
          <JingleBells size={54} className="absolute top-[5%] right-[5%]" />
          <p className="relative text-[clamp(10px,2.4vw,14px)] font-bold tracking-[0.3em] uppercase opacity-90">The 7-week holiday challenge</p>
          <h1 className="relative mt-2 text-[clamp(30px,10vw,64px)] leading-[0.95] font-black tracking-tight uppercase">
            Maintain,
            <br />
            Don&apos;t Gain
          </h1>
          <p className="relative mt-3 text-[clamp(13px,3.4vw,22px)] font-bold">{dates} · Free to join</p>
        </header>

        {/* QR */}
        <section className="-mt-[5%] flex flex-col items-center px-[6%]">
          <div className="relative rounded-3xl bg-white p-[4%] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.35)] ring-4 ring-[#f2b51e]">
            <div className="w-[clamp(140px,42vw,260px)]" dangerouslySetInnerHTML={{ __html: qr }} />
          </div>
          <p className="mt-3 text-[clamp(18px,5vw,32px)] font-black tracking-tight text-[#c8283f]">📱 SCAN TO JOIN</p>
          <p className="text-[clamp(10px,2.4vw,14px)] text-[#74695e]">{joinUrl.replace(/^https?:\/\//, "")}</p>
          {settings.join_code && (
            <p className="mt-1 rounded-full bg-[#f2b51e]/25 px-4 py-1 text-[clamp(11px,2.8vw,16px)] font-bold">
              Challenge code: <span className="tracking-widest">{settings.join_code}</span>
            </p>
          )}
        </section>

        {/* steps */}
        <section className="mt-[4%] grid grid-cols-3 gap-[3%] px-[6%] text-center">
          {[
            { n: 1, t: "Scan the code", d: "with your phone's camera" },
            { n: 2, t: "Join", d: "first & last name + a 4-digit PIN" },
            { n: 3, t: "Add to Home Screen", d: "iPhone: Share ⬆️ → Add to Home Screen · Android: ⋮ → Add to Home screen" },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-white p-[8%] ring-1 ring-[#e8dfd1]">
              <span className="mx-auto flex size-[clamp(24px,6vw,38px)] items-center justify-center rounded-full bg-gradient-to-br from-[#c8283f] to-[#e8762c] text-[clamp(12px,3vw,18px)] font-black text-white">
                {s.n}
              </span>
              <p className="mt-2 text-[clamp(11px,2.8vw,16px)] leading-tight font-bold">{s.t}</p>
              <p className="mt-1 text-[clamp(8px,2vw,12px)] leading-snug text-[#74695e]">{s.d}</p>
            </div>
          ))}
        </section>

        {/* perks */}
        <section className="mt-auto px-[6%] pb-[5%] text-center">
          <div className="flex flex-wrap justify-center gap-x-[4%] gap-y-1 text-[clamp(11px,2.8vw,17px)] font-bold">
            <span>🏋️ Log workouts</span>
            <span>🎡 Spin the prize wheel</span>
            <span>🏆 Earn trophies</span>
          </div>
          <p className="mt-2 text-[clamp(9px,2.2vw,13px)] text-[#74695e]">
            Ask the front desk about 🥇 Gold (4 personal training sessions) and 💎 Diamond (8 sessions).
          </p>
        </section>
      </article>
    </div>
  );
}
