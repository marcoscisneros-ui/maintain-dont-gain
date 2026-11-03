"use client";

import { Input } from "./ui";

/** Height as feet + inches; value/onChange use total inches as a string ("" = empty). */
export function HeightInput({ value, onChange }: { value: string; onChange: (inches: string) => void }) {
  const total = value === "" ? null : Number(value);
  const ft = total == null ? "" : String(Math.floor(total / 12));
  const inch = total == null ? "" : String(Math.round((total % 12) * 10) / 10);

  function update(nextFt: string, nextIn: string) {
    if (nextFt === "" && nextIn === "") return onChange("");
    onChange(String((Number(nextFt) || 0) * 12 + (Number(nextIn) || 0)));
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        type="number"
        inputMode="numeric"
        aria-label="Height, feet"
        placeholder="5"
        value={ft}
        onChange={(e) => update(e.target.value, inch)}
        suffix="ft"
      />
      <Input
        type="number"
        inputMode="decimal"
        aria-label="Height, inches"
        placeholder="10"
        value={inch === "0" && ft === "" ? "" : inch}
        onChange={(e) => update(ft, e.target.value)}
        suffix="in"
      />
    </div>
  );
}

export function isValidHeight(inches: string | number | null | undefined): boolean {
  const n = Number(inches);
  return n >= 48 && n <= 90; // 4'0" – 7'6"
}

export function formatHeight(inches: number | null | undefined): string {
  if (inches == null) return "";
  const n = Number(inches);
  return `${Math.floor(n / 12)}′${Math.round(n % 12)}″`;
}
