"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/components/AuthProvider";
import { PinInput } from "@/components/PinInput";
import { Button, ErrorText, Field, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { isValidPin, normalizeUsername, pinToPassword, usernameToEmail } from "@/lib/username";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && session) router.replace("/home");
  }, [loading, session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const u = normalizeUsername(username);
    if (!u.includes(".")) return setError("Use your first and last name, like jane.doe");
    if (!isValidPin(pin)) return setError("Enter your 4-digit PIN.");
    setBusy(true);
    const { error } = await supabase().auth.signInWithPassword({
      email: usernameToEmail(u),
      password: pinToPassword(pin),
    });
    setBusy(false);
    if (error) {
      setPin("");
      setError(
        error.status === 429
          ? "Too many tries. Wait a few minutes and try again."
          : "That name and PIN don't match. Double-check, or ask staff to reset your PIN.",
      );
      return;
    }
    router.replace("/home");
  }

  return (
    <AuthShell>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Username">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="first.lastname"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
          />
        </Field>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-muted">PIN</span>
          <PinInput value={pin} onChange={setPin} />
        </div>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full" loading={busy}>
          Let&apos;s go
        </Button>
      </form>
      <p className="mt-8 text-center text-muted">
        New to the challenge?{" "}
        <Link href="/join" className="font-semibold text-brand">
          Join here
        </Link>
      </p>
    </AuthShell>
  );
}
