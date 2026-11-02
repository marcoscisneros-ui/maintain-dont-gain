"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/components/AuthProvider";
import { PinInput } from "@/components/PinInput";
import { Button, ErrorText, Field, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { isValidPin, namePart, pinToPassword, usernameToEmail } from "@/lib/username";

export default function JoinPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [code, setCode] = useState("");
  const [codeRequired, setCodeRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session && !created) router.replace("/home");
  }, [loading, session, router, created]);

  useEffect(() => {
    fetch("/api/signup")
      .then((r) => r.json())
      .then((d) => setCodeRequired(!!d.codeRequired))
      .catch(() => {});
  }, []);

  const preview = namePart(first) && namePart(last) ? `${namePart(first)}.${namePart(last)}` : "first.lastname";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!first.trim() || !last.trim()) return setError("Please enter your first and last name.");
    if (!isValidPin(pin)) return setError("Pick a 4-digit PIN.");
    if (pin !== pin2) return setError("Those PINs don't match. Try again.");
    setBusy(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: first, lastName: last, pin, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return setError(data.error ?? "Something went wrong. Try again.");
    }
    setCreated(data.username);
    const { error } = await supabase().auth.signInWithPassword({
      email: usernameToEmail(data.username),
      password: pinToPassword(pin),
    });
    setBusy(false);
    if (error) return setError("Account created! Please log in.");
  }

  if (created) {
    return (
      <AuthShell tagline="You're in. Welcome to the challenge!">
        <div className="pop rounded-3xl bg-card p-6 text-center shadow-card ring-1 ring-line/60">
          <p className="text-muted">Your username is</p>
          <p className="mt-1 text-3xl font-bold text-brand">{created}</p>
          <p className="mt-3 text-sm text-muted">
            Screenshot this. You&apos;ll log in with this name and your 4-digit PIN.
          </p>
          <Button className="mt-6 w-full" onClick={() => router.replace("/setup")}>
            Set up my profile
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell tagline="Join in under a minute. No email needed.">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <Input value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" autoFocus />
          </Field>
          <Field label="Last name">
            <Input value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
          </Field>
        </div>
        <p className="-mt-2 text-sm text-muted">
          Your username will be <span className="font-semibold text-ink">{preview}</span>
        </p>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-muted">Pick a 4-digit PIN</span>
          <PinInput value={pin} onChange={setPin} />
        </div>
        {pin.length === 4 && (
          <div className="fade">
            <span className="mb-1.5 block text-sm font-medium text-muted">Type it again</span>
            <PinInput value={pin2} onChange={setPin2} autoFocus />
          </div>
        )}
        {codeRequired && (
          <Field label="Challenge code" hint="Get this from the front desk.">
            <Input value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" />
          </Field>
        )}
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full" loading={busy}>
          Join the challenge
        </Button>
      </form>
      <p className="mt-8 text-center text-muted">
        Already joined?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
