import { ExternalLink, HeartHandshake } from "lucide-react";

/** "Encourage someone else" card linking to the Facebook community group. */
export function CommunityCard({ url, compact }: { url: string; compact?: boolean }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rise block overflow-hidden rounded-3xl bg-gradient-to-br from-[#1877f2] to-[#0b4fb3] p-5 text-white shadow-[0_14px_30px_-16px_#1877f2] transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <HeartHandshake className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-snug font-bold">Encourage someone else to get their workout today</p>
          {!compact && (
            <p className="mt-1 text-sm text-white/85">Drop a shout-out, share your sweat, or tag a friend in our Facebook community group.</p>
          )}
        </div>
      </div>
      <span className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-[#1877f2]">
        Open our Facebook group <ExternalLink className="size-4" />
      </span>
    </a>
  );
}
