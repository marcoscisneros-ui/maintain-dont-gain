export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brand)" />
          <stop offset="1" stopColor="var(--brand-2)" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#lg)" />
      <rect x="128" y="186" width="256" height="48" rx="24" fill="#fff" />
      <rect x="128" y="278" width="256" height="48" rx="24" fill="#fff" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`leading-[0.95] font-extrabold tracking-tight uppercase ${className}`}>
      <div>Maintain,</div>
      <div>
        Don&apos;t <span className="text-brand">Gain</span>
      </div>
    </div>
  );
}
