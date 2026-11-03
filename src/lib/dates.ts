// Everything runs on San Angelo time (US Central), regardless of the phone's setting.
export const TZ = "America/Chicago";

/** Today's date in Central time as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function hourCT(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(now),
  );
}

const toUTC = (iso: string) => Date.parse(iso + "T00:00:00Z");

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((toUTC(toISO) - toUTC(fromISO)) / 86_400_000);
}

export function addDays(iso: string, n: number): string {
  return new Date(toUTC(iso) + n * 86_400_000).toISOString().slice(0, 10);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Date(toUTC(iso)).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
}

export type ProgramStatus = {
  phase: "before" | "during" | "after";
  /** 1-based day of the program (clamped to 1..totalDays) */
  day: number;
  totalDays: number;
  daysUntilStart: number;
};

export function programStatus(start: string, end: string, today: string = todayISO()): ProgramStatus {
  const totalDays = daysBetween(start, end) + 1;
  const offset = daysBetween(start, today);
  if (offset < 0) return { phase: "before", day: 1, totalDays, daysUntilStart: -offset };
  if (offset >= totalDays) return { phase: "after", day: totalDays, totalDays, daysUntilStart: 0 };
  return { phase: "during", day: offset + 1, totalDays, daysUntilStart: 0 };
}

export function greeting(now: Date = new Date()): string {
  const h = hourCT(now);
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Minutes between Central time and UTC at a given instant (e.g. -360 in winter). */
function tzOffsetMinutes(utcMs: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUTC - utcMs) / 60000);
}

/** "2026-11-25T17:30" typed as San Angelo time → ISO timestamp. */
export function centralToISO(local: string): string {
  const [d, t = "00:00"] = local.split("T");
  const [y, m, dd] = d.split("-").map(Number);
  const [hh, mi] = t.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, dd, hh, mi);
  let ms = guess - tzOffsetMinutes(guess) * 60000;
  ms = guess - tzOffsetMinutes(ms) * 60000; // correct across DST changes
  return new Date(ms).toISOString();
}

/** ISO timestamp → "YYYY-MM-DDTHH:mm" in San Angelo time (for datetime inputs). */
export function isoToCentralLocal(iso: string): string {
  const ms = Date.parse(iso);
  return new Date(ms + tzOffsetMinutes(ms) * 60000).toISOString().slice(0, 16);
}
