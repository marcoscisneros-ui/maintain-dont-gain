import { createClient } from "@supabase/supabase-js";
import { isValidPin, pinToPassword } from "@/lib/username";

// Admin-only actions that need the secret key: reset a PIN, grant/remove admin, remove a member.
// The caller must send their login token and be an admin.

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return fail("Not logged in", 401);

  const sb = serviceClient();
  const { data: auth } = await sb.auth.getUser(token);
  if (!auth?.user) return fail("Not logged in", 401);
  const { data: me } = await sb.from("profiles").select("is_admin").eq("id", auth.user.id).maybeSingle();
  if (!me?.is_admin) return fail("Admins only", 403);

  let body: { action?: string; userId?: string; pin?: string; value?: boolean; tier?: string; status?: string; delta?: number };
  try {
    body = await req.json();
  } catch {
    return fail("Bad request");
  }
  const { action, userId } = body;
  if (action === "generate_push_keys") {
    const webpush = (await import("web-push")).default;
    return Response.json(webpush.generateVAPIDKeys());
  }
  if (!userId) return fail("Missing member");
  const self = userId === auth.user.id;

  switch (action) {
    case "reset_pin": {
      if (!isValidPin(body.pin ?? "")) return fail("PIN must be 4 digits.");
      const { error } = await sb.auth.admin.updateUserById(userId, { password: pinToPassword(body.pin!) });
      return error ? fail(error.message, 500) : Response.json({ ok: true });
    }
    case "set_admin": {
      if (self && !body.value) return fail("You can't remove your own admin access.");
      const { error } = await sb.from("profiles").update({ is_admin: !!body.value }).eq("id", userId);
      return error ? fail(error.message, 500) : Response.json({ ok: true });
    }
    case "delete_member": {
      if (self) return fail("You can't remove yourself.");
      // Remove their photos, then the account (logs are removed automatically).
      for (const bucket of ["private", "avatars"]) {
        const { data: files } = await sb.storage.from(bucket).list(userId, { limit: 1000 });
        if (files?.length) await sb.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
      }
      const { error } = await sb.auth.admin.deleteUser(userId);
      return error ? fail(error.message, 500) : Response.json({ ok: true });
    }
    case "set_tier": {
      const tier = body.tier ?? "";
      const status = body.status ?? "confirmed";
      if (!["free", "gold", "diamond"].includes(tier) || !["pending", "confirmed"].includes(status)) return fail("Unknown tier");
      const { error } = await sb.from("profiles").update({ tier, tier_status: tier === "free" ? "confirmed" : status }).eq("id", userId);
      return error ? fail(error.message, 500) : Response.json({ ok: true });
    }
    case "adjust_sessions": {
      const delta = Math.sign(Number(body.delta) || 0);
      const { data: p, error: e1 } = await sb.from("profiles").select("sessions_used").eq("id", userId).single();
      if (e1 || !p) return fail("Member not found", 404);
      const next = Math.max(0, p.sessions_used + delta);
      const { error } = await sb.from("profiles").update({ sessions_used: next }).eq("id", userId);
      return error ? fail(error.message, 500) : Response.json({ ok: true, sessions_used: next });
    }
    case "turn_off_blind": {
      const { error } = await sb.from("profiles").update({ blind_weight: false, reveal_hash: null }).eq("id", userId);
      return error ? fail(error.message, 500) : Response.json({ ok: true });
    }
    default:
      return fail("Unknown action");
  }
}
