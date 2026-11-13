# Maintain, Don't Gain

A mobile web app for our 7-week holiday challenge (Nov 16 – Jan 3).
Members open a link, join with their name and a 4-digit PIN, and add it to their home screen.

**Stack:** Next.js (the app) · Supabase (logins, database, photo storage) · Vercel (hosting).
All three have free plans that comfortably cover 15–30 members.

---

## One-time setup (about 20 minutes)

### 1. Create the Supabase project
1. Go to <https://supabase.com/dashboard> → **New project**.
2. Name it `maintain-dont-gain`, choose a strong database password (save it somewhere), and pick the region closest to Texas (e.g. *East US* or *Central US*).
3. Wait about 2 minutes for it to finish setting up.

### 2. Create the database
1. In the project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase/01_schema.sql` from this repo, copy **all** of it, paste it in, and click **Run**.
3. You should see "Success. No rows returned."

### 2b. Load the starter content
Same as above, but with `supabase/02_content.sql`: **New query** → paste all of it → **Run**.
This adds the 49 daily messages, 49 tips, starter recipes, and a welcome announcement.
(Run it only once, or you'll get duplicates.)

### 2c. Height + visceral fat update
Run `supabase/03_height_visceral.sql` the same way. It's safe to run more than once.

### 2d. Hearts update
Run `supabase/04_hearts.sql` the same way (safe to run more than once). This adds the ❤️ and "seen" tracking on daily messages.

### 2e. Levels, personal training & class ratings update
Run `supabase/05_tiers_classes.sql` the same way (safe to run more than once). Adds Free / Gold / Diamond levels, personal-training workouts (5 pts), and class names + ratings.

### 2f. Prize wheel update
Run `supabase/06_rewards.sql` the same way (safe to run more than once). Adds the weekly prize wheel, certificates, and 5 starter prizes (edit them in Admin → Rewards).

### 2g. Prize list update
Run `supabase/07_wheel_prizes.sql` the same way (safe to run more than once). Loads the real prize list and lets a prize appear several times on the wheel.

### 2h. Phone numbers + 5-day spin update
Run `supabase/08_phone_and_spin5.sql` the same way (safe to run more than once). Adds members' phone numbers and sets the prize wheel to 5 workout days per week.

### 2i. Bonus point days update
Run `supabase/09_bonus_days.sql` the same way (safe to run more than once). Lets you pick 2X point days in Admin → Settings → Points.

### 2j. InBody voucher update
Run `supabase/10_inbody_vouchers.sql` the same way (safe to run more than once). Every member (including people who already joined) gets 3 free InBody scan vouchers: 2 ready right away, 1 that unlocks in the challenge's final week.

### 2k. Messages update
Run `supabase/11_messages.sql` the same way (safe to run more than once). Lets staff send messages to members' in-app inbox.

### 2l. Blind weigh-ins update
Run `supabase/12_blind_weighins.sql` the same way (safe to run more than once). Lets members hide their weight (they only see up / down / steady, with a reveal code), and lets staff enter weigh-ins for any member.

### 3. Lock down sign-ups (important)
**Authentication → Sign In / Providers → Email** (or **Authentication → Settings**):
- Turn **OFF** "Allow new users to sign up". (The app creates accounts itself. This stops anyone from going around it.)
- "Confirm email" can be off. No emails are ever sent.

### 4. Copy your keys
**Project Settings → API Keys** (and **Data API** for the URL). You need three values:
| Name in Vercel | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://abcd1234.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The **publishable** key (`sb_publishable_…`), or the legacy **anon** key |
| `SUPABASE_SECRET_KEY` | The **secret** key (`sb_secret_…`), or the legacy **service_role** key. **Never share this one.** |

### 5. Deploy on Vercel
1. Go to <https://vercel.com/new> and **Import** this GitHub repository.
2. Before clicking Deploy, open **Environment Variables** and add the three values above.
3. Click **Deploy**. In about a minute you'll get a URL like `maintain-dont-gain.vercel.app`.

### 6. Make yourself the admin
Open the URL on your phone and **join first**. The very first account created becomes the admin.

From then on, every time code is pushed to GitHub, Vercel redeploys automatically.

---

## Running the challenge (admin)
Log in as usual. Admins see an **Admin** button at the top of Home (and on the profile page).
- **Members:** ✉️ **Message members** (everyone, one person, picked members, Gold, Diamond, pending, or who hasn't logged today; see who read it, or text them instead). 🗑 on any row removes a member. Engagement (days logged, streak, last seen), points, InBody changes, progress photos. Levels: Free / 🥇 Gold (4 PT sessions) / 💎 Diamond (8). Gold and Diamond show as pending until you tap **Confirm** after they pay; use **+1 session** after each personal training session. Tap a member to reset their PIN, make them staff/admin, or remove them. Download **Summary CSV** or **All logs CSV**.
- **Posts:** announcements (can be pinned) and pop-up events with a date and time.
- **Daily:** your daily messages and tips, one per day in list order. Edit, add, or reorder them with the arrows. Each message shows 👀 how many members saw it and ❤️ how many hearted it. Tap one to see who.
- **Rewards:** look up any code here, prize certificates (MDG-…) or InBody vouchers (IB-…), and tap **Mark used / Mark redeemed**. Members who work out 5 different days in a week (Mon–Sun) earn a spin. Look up a certificate code (e.g. MDG-7K3Q) and tap **Mark redeemed** when they claim it. Add/edit prizes and their odds here.
- **Classes:** which classes members take, average star ratings, and their comments (plus personal training).
- **Recipes:** add, edit, or delete recipes and tips, with photos.
- **Settings:** your headshot and title, GroupMe, Facebook group and class links, point values, daily point cap, dates, and an optional join code.

## Good to know
- **Logins:** username is `first.lastname` (accents and apostrophes are dropped; a duplicate name gets a number, like `jane.doe2`). PINs are 4 digits. Staff can reset a forgotten PIN in the admin area (stage 4).
- **Privacy:** database rules (Row Level Security) make sure members only ever see their own logs, weights, and photos. Admins can see everyone's. The leaderboard only shows first name, last initial, photo, and points.
- **Time zone:** "today" always means San Angelo (Central) time.
- **Supabase free projects pause after 7 days with no activity.** Before kickoff, open the app at least once a week. Once members are using it daily, this won't happen.
- **Vercel's free (Hobby) plan** is officially meant for non-commercial projects. For a free member challenge this size, most people stay on Hobby; Vercel Pro is $20/mo if you want to be strictly by the book.

## Running it locally (optional, for developers)
```bash
npm install
cp .env.example .env.local   # fill in the three values
npm run dev
```
