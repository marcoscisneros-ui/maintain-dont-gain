import type { Settings } from "./settings";

/**
 * The gym app has separate App Store / Google Play links, so pick the right one
 * for this phone. Falls back to the website link (or whichever link exists).
 */
export function classLink(s: Settings): string {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1); // iPadOS
  const isAndroid = /Android/i.test(ua);
  if (isIOS && s.class_url_ios) return s.class_url_ios;
  if (isAndroid && s.class_url_android) return s.class_url_android;
  return s.class_url || s.class_url_ios || s.class_url_android || "";
}
