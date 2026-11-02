import { createClient } from "@supabase/supabase-js";
import { isValidPin, namePart, pinToPassword, usernameToEmail } from "@/lib/username";

// Creates a member account with a "first.lastname" username and a PIN.
// Runs on the server with the secret key so no confirmation email is needed.

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Server is missing SUPABASE_SECRET_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function joinCode(sb: ReturnType<typeof admin>) {
  const { data } = await sb.from("settings").select("value").eq("key", "join_code").maybeSingle();
  return (data?.value ?? "").trim();
}

/** Tells the sign-up page whether a join code is required. */
export async function GET() {
  try {
    const code = await joinCode(admin());
    return Response.json({ codeRequired: code.length > 0 });
  } catch {
    return Response.json({ codeRequired: false });
  }
}

export async function POST(req: Request) {
  let body: { firstName?: string; lastName?: string; pin?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const firstName = (body.firstName ?? "").trim().slice(0, 40);
  const lastName = (body.lastName ?? "").trim().slice(0, 40);
  const pin = (body.pin ?? "").trim();
  const first = namePart(firstName);
  const last = namePart(lastName);

  if (!first || !last) return Response.json({ error: "Please enter your first and last name." }, { status: 400 });
  if (!isValidPin(pin)) return Response.json({ error: "Your PIN must be exactly 4 digits." }, { status: 400 });

  let sb: ReturnType<typeof admin>;
  try {
    sb = admin();
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }

  const required = await joinCode(sb);
  if (required && required.toLowerCase() !== (body.code ?? "").trim().toLowerCase()) {
    return Response.json({ error: "That challenge code isn't right. Ask the front desk." }, { status: 403 });
  }

  // Pick a free username: jane.doe, jane.doe2, jane.doe3 ...
  const base = `${first}.${last}`;
  const { data: taken } = await sb.from("profiles").select("username").like("username", `${base}%`);
  const used = new Set((taken ?? []).map((r) => r.username));
  let username = base;
  for (let i = 2; used.has(username); i++) username = `${base}${i}`;

  const { data: created, error } = await sb.auth.admin.createUser({
    email: usernameToEmail(username),
    password: pinToPassword(pin),
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, username },
  });
  if (error || !created.user) {
    return Response.json({ error: error?.message ?? "Could not create account." }, { status: 500 });
  }

  // The very first person to sign up becomes the admin (that's you, Marcos).
  const { count } = await sb.from("profiles").select("id", { count: "exact", head: true });

  const { error: pErr } = await sb.from("profiles").insert({
    id: created.user.id,
    username,
    first_name: firstName,
    last_name: lastName,
    is_admin: (count ?? 0) === 0,
  });
  if (pErr) {
    await sb.auth.admin.deleteUser(created.user.id);
    return Response.json({ error: pErr.message }, { status: 500 });
  }

  return Response.json({ username });
}
