"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { Button } from "./ui";
import { disablePush, enablePush, pushStatus, type PushStatus } from "@/lib/push";

/**
 * "Turn on notifications" for this phone. `compact` = the dismissible card on Home
 * (hidden once on, or if not available); otherwise the full status block on the profile page.
 */
export function NotificationsCard({ userId, compact }: { userId: string; compact?: boolean }) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    pushStatus().then(setStatus).catch(() => setStatus("unsupported"));
    try {
      setDismissed(localStorage.getItem("mdg-push-dismissed") === "1");
    } catch {}
  }, []);

  if (!status || status === "not-configured") return null;
  if (compact && (status === "on" || status === "unsupported" || status === "denied" || dismissed)) return null;

  async function turnOn() {
    setBusy(true);
    try {
      setStatus(await enablePush(userId));
    } catch {
      setStatus("unsupported");
    } finally {
      setBusy(false);
    }
  }

  const body =
    status === "needs-install" ? (
      <>
        <p className="text-sm text-muted">
          On iPhone, notifications only work from the app on your Home Screen: tap <b>Share ⬆️</b> in Safari, then <b>Add to Home Screen</b>, then open the app
          from there and come back here.
        </p>
      </>
    ) : status === "denied" ? (
      <p className="text-sm text-muted">Notifications are blocked for this app. Turn them on in your phone&apos;s Settings → Notifications, then come back.</p>
    ) : status === "unsupported" ? (
      <p className="text-sm text-muted">This browser can&apos;t show notifications. Try Chrome on Android, or the Home Screen app on iPhone.</p>
    ) : status === "on" ? (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-accent">✓ On for this phone</p>
        <button
          onClick={async () => {
            await disablePush();
            setStatus("off");
          }}
          className="text-xs text-muted underline"
        >
          Turn off
        </button>
      </div>
    ) : (
      <>
        <p className="text-sm text-muted">Get a heads-up when Marcos sends a message, plus pop-up events and bonus point days.</p>
        <Button className="mt-3 w-full" onClick={turnOn} loading={busy}>
          <BellRing className="size-5" /> Turn on notifications
        </Button>
      </>
    );

  return (
    <div className="rise relative rounded-3xl bg-card p-4 shadow-card ring-1 ring-line/60">
      {compact && (
        <button
          onClick={() => {
            setDismissed(true);
            try {
              localStorage.setItem("mdg-push-dismissed", "1");
            } catch {}
          }}
          className="absolute top-3 right-3 p-1 text-muted"
          aria-label="Not now"
        >
          <X className="size-4" />
        </button>
      )}
      <p className="mb-1 flex items-center gap-2 font-semibold">📲 Phone notifications</p>
      {body}
    </div>
  );
}
