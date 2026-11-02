"use client";

import Link from "next/link";
import { forwardRef } from "react";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({
  className,
  children,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("rounded-3xl bg-card p-5 shadow-card ring-1 ring-line/60", className)} style={style}>
      {children}
    </div>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const btnBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
const btnVariants: Record<BtnVariant, string> = {
  primary: "brand-gradient text-brand-ink shadow-[0_8px_20px_-8px_var(--brand)]",
  secondary: "bg-card-2 text-ink ring-1 ring-line",
  ghost: "text-muted hover:text-ink",
  danger: "bg-danger/10 text-danger",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean }
>(function Button({ variant = "primary", loading, className, children, disabled, ...rest }, ref) {
  return (
    <button ref={ref} className={cn(btnBase, btnVariants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner /> : children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  external,
}: {
  href: string;
  variant?: BtnVariant;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const cls = cn(btnBase, btnVariants[variant], className);
  if (external)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      aria-label="Loading"
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }>(
  function Input({ className, suffix, ...rest }, ref) {
    return (
      <div className="relative">
        <input
          ref={ref}
          className={cn(
            "h-13 w-full rounded-2xl bg-card-2 px-4 text-lg text-ink ring-1 ring-line outline-none transition placeholder:text-muted/60 focus:ring-2 focus:ring-brand",
            suffix && "pr-14",
            className,
          )}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-muted">
            {suffix}
          </span>
        )}
      </div>
    );
  },
);

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="fade rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{children}</p>;
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-brand">
      <Spinner className="size-8" />
    </div>
  );
}
