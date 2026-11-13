import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Staff-only: send a phone notification to members who turned notifications on.
const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return fail("Phone notifications aren't set up yet (Admin → Settings → Phone notifications).", 503);

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return fail("Not logged in", 401);
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth } = await sb.auth.getUser(token);
  if (!auth?.user) return fail("Not logged in", 401);
  const { data: me } = await sb.from("profiles").select("is_admin").eq("id", auth.user.id).maybeSingle();
  if (!me?.is_admin) return fail("Admins only", 403);

  let body: { userIds?: string[]; title?: string; body?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Bad request");
  }
  const ids = (body.userIds ?? []).slice(0, 2000);
  if (!ids.length) return Response.json({ sent: 0, devices: 0 });

  const { data: subs, error } = await sb.from("push_subscriptions").select("id,endpoint,p256dh,auth").in("user_id", ids);
  if (error) return fail("Run 13_push.sql in Supabase first.", 500);

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", pub, priv);
  const payload = JSON.stringify({
    title: (body.title || "Maintain, Don't Gain").slice(0, 80),
    body: (body.body || "You have a new message.").slice(0, 240),
    url: body.url || "/inbox",
  });

  let sent = 0;
  const gone: number[] = [];
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24, timeout: 10_000 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.id); // phone unsubscribed / app removed
      }
    }),
  );
  if (gone.length) await sb.from("push_subscriptions").delete().in("id", gone);
  return Response.json({ sent, devices: subs?.length ?? 0 });
}
