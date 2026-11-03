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
- **Members:** engagement (days logged, streak, last seen), points, InBody changes, progress photos. Tap a member to reset their PIN, make them staff/admin, or remove them. Download **Summary CSV** or **All logs CSV**.
- **Posts:** announcements (can be pinned) and pop-up events with a date and time.
- **Daily:** your daily messages and tips, one per day in list order. Edit, add, or reorder them with the arrows.
- **Recipes:** add, edit, or delete recipes and tips, with photos.
- **Settings:** your headshot and title, GroupMe and class links, point values, daily point cap, dates, and an optional join code.

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
