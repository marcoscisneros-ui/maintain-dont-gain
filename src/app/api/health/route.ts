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
      const t = await sb.from("profiles").select("tier", { head: true }).limit(1);
      report.tiers_and_classes_update = t.error ? "MISSING ✗ (run 05_tiers_classes.sql)" : "installed ✓";
      const r = await sb.from("prizes").select("id", { head: true }).limit(1);
      report.rewards_update = r.error ? "MISSING ✗ (run 06_rewards.sql)" : "installed ✓";
      const w = await sb.from("prizes").select("slots", { head: true }).limit(1);
      report.prize_list_update = w.error ? "MISSING ✗ (run 07_wheel_prizes.sql)" : "installed ✓";
      const ph = await sb.from("profiles").select("phone", { head: true }).limit(1);
      report.phone_update = ph.error ? "MISSING ✗ (run 08_phone_and_spin5.sql)" : "installed ✓";
      const vo = await sb.from("vouchers").select("id", { head: true }).limit(1);
      report.inbody_vouchers_update = vo.error ? "MISSING ✗ (run 10_inbody_vouchers.sql)" : "installed ✓";
      const ms = await sb.from("messages").select("id", { head: true }).limit(1);
      report.messages_update = ms.error ? "MISSING ✗ (run 11_messages.sql)" : "installed ✓";
      const bw = await sb.from("profiles").select("blind_weight", { head: true }).limit(1);
      report.blind_weighins_update = bw.error ? "MISSING ✗ (run 12_blind_weighins.sql)" : "installed ✓";
    } catch (e) {
      report.database = `ERROR: ${(e as Error).message}`;
    }
  }

  const ok = Object.values(report).every((v) => !v.includes("MISSING") && !v.startsWith("ERROR"));
  return Response.json({ ok, ...report }, { headers: { "Cache-Control": "no-store" } });
}
