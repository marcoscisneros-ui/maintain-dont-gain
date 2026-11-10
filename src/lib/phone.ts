/** US phone helpers. Stored as 10 digits ("3255550123"), shown as (325) 555-0123. */

export function phoneDigits(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.slice(0, 10);
}

export function isValidPhone(input: string): boolean {
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(phoneDigits(input));
}

/** Formats as the person types: 325 → (325), 3255 → (325) 5, ... */
export function formatPhone(input: string | null | undefined): string {
  const d = phoneDigits(input ?? "");
  if (d.length <= 3) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
