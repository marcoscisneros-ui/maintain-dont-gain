import { createClient } from "@supabase/supabase-js";
import { certificateCode, pickPrize, unspentWeeks, weeklyProgress, type Prize } from "@/lib/rewards";

// Spins the wheel. The prize is chosen HERE on the server, never on the phone,
// and each earned week can be spun only once.

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return fail("Not logged in", 401);
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth } = await sb.auth.getUser(token);
  const userId = auth?.user?.id;
  if (!userId) return fail("Not logged in", 401);

  const [settings, workouts, spins, prizes] = await Promise.all([
    sb.from("settings").select("key,value").in("key", ["start_date", "end_date", "spin_min_days"]),
    sb.from("workouts").select("date").eq("user_id", userId),
    sb.from("spins").select("week_start").eq("user_id", userId),
    sb.from("prizes").select("id,name,weight,active"),
  ]);
  if (settings.error || workouts.error || spins.error || prizes.error) return fail("Couldn't load your workouts. Try again.", 500);

  const s = Object.fromEntries((settings.data ?? []).map((r) => [r.key, r.value]));
  const progress = weeklyProgress(
    (workouts.data ?? []).map((w) => w.date),
    s.start_date,
    s.end_date,
    Number(s.spin_min_days) || 4,
  );
  const weeks = unspentWeeks(progress, spins.data ?? []);
  if (!weeks.length) return fail("No spins available yet. Keep logging workouts!");

  const prize = pickPrize((prizes.data ?? []) as Prize[]);
  if (!prize) return fail("The prize wheel isn't set up yet. Let the front desk know!");

  // Insert with a fresh code; retry if the code happens to be taken.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await sb
      .from("spins")
      .insert({ user_id: userId, week_start: weeks[0], prize_id: prize.id, prize_name: prize.name, code: certificateCode() })
      .select("*")
      .single();
    if (!error) return Response.json({ spin: data, prize, remaining: weeks.length - 1 });
    if (error.code === "23505" && error.message.includes("user_id")) return fail("That week was already spun.", 409); // double tap
    if (error.code !== "23505") return fail(error.message, 500);
  }
  return fail("Couldn't create your certificate. Try again.", 500);
}
