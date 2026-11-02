import { LogoMark, Wordmark } from "./Logo";

/** Shared look for the login / join screens. */
export function AuthShell({ children, tagline }: { children: React.ReactNode; tagline?: string }) {
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-safe pb-safe">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-96 opacity-25 blur-3xl brand-gradient"
        style={{ borderRadius: "50%" }}
      />
      <div className="rise mt-12 mb-8">
        <LogoMark size={52} />
        <Wordmark className="mt-5 text-[44px]" />
        <p className="mt-3 text-lg text-muted">
          {tagline ?? "Seven weeks. Every holiday. Zero pounds gained."}
        </p>
      </div>
      <div className="rise pb-10" style={{ animationDelay: "80ms" }}>
        {children}
      </div>
    </main>
  );
}
