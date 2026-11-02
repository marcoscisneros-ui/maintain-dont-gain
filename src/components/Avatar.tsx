import { cn } from "./ui";

export function Avatar({
  url,
  name,
  size = 44,
  className,
}: {
  url?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-card-2 font-semibold text-muted ring-2 ring-card",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
