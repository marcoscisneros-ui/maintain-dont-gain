import { createClient } from "@supabase/supabase-js";

// Open /api/health in a browser to check the setup. Never shows the key values themselves.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;

  const report: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL: url ? "set ✓" : "MISSING ✗",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable ? "set ✓" : "MISSING ✗",
    SUPABASE_SECRET_KEY: secret ? "set ✓" : "MISSING ✗",
  };

  if (url && secret) {
    try {
      const sb = createClient(url, secret, { auth: { persistSession: false } });
      const [settings, content, members] = await Promise.all([
        sb.from("settings").select("key", { count: "exact", head: true }),
        sb.from("daily_content").select("id", { count: "exact", head: true }),
        sb.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      report.database = settings.error
        ? `ERROR: ${settings.error.message} (did 01_schema.sql run?)`
        : "connected ✓";
      report.daily_messages_and_tips = content.error
        ? "unknown"
        : `${content.count ?? 0}${content.count ? " ✓" : " (run 02_content.sql)"}`;
      report.members = members.error ? "unknown" : String(members.count ?? 0);
      const v = await sb.from("inbody_scans").select("visceral_fat", { head: true }).limit(1);
      report.height_and_visceral_update = v.error ? "MISSING ✗ (run 03_height_visceral.sql)" : "installed ✓";
      const h = await sb.from("daily_engagement").select("content_id", { head: true }).limit(1);
      report.hearts_update = h.error ? "MISSING ✗ (run 04_hearts.sql)" : "installed ✓";
    } catch (e) {
      report.database = `ERROR: ${(e as Error).message}`;
    }
  }

  const ok = Object.values(report).every((v) => !v.includes("MISSING") && !v.startsWith("ERROR"));
  return Response.json({ ok, ...report }, { headers: { "Cache-Control": "no-store" } });
}
