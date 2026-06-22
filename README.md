# ZBPrayerApp

A prayer app for **Zion Bishan**, adapted from the `nextlvlprayer` system. Every
prayer lights a candle. Instead of a world map, the home page shows **three
candle-lit bubbles** — one per filter:

| Filter        | Ministry umbrella | Sub-filters (extend in `src/data/categories.ts`)         |
| ------------- | ----------------- | -------------------------------------------------------- |
| **Our People** (largest bubble) | — | Church Leaders, Community Requests |
| **Our Church** | Home Missions    | Tuition Ministry, Terusan Ministry, Events               |
| **Our World**  | Foreign Missions | Mission Partners                                         |

Prayer points come from the church bulletin's **Prayer Points** section
(<https://www.zionbishan.org.sg/services/english/bulletins/latest/>), which is
already grouped under these exact three headings.

Built with **Next.js 16 + React 19 + Tailwind v4 + TypeScript**, with
**Supabase** as an optional backend (the app runs fully offline on the curated
seed data in `src/data/prayerData.ts` when no Supabase env vars are present).

---

## Location

This project lives **outside OneDrive** to avoid file-sync locking issues:

```
C:\ClaudeLocal\zbprayerapp
```

Keep it on a local, non-synced path. If you ever move it, use a folder that
OneDrive / Dropbox / Google Drive do **not** sync.

## Run locally

Open **PowerShell** (or a terminal) and run:

```powershell
cd C:\ClaudeLocal\zbprayerapp
npm install      # first time only
npm run dev
# then open http://localhost:3000
```

No backend needed for local dev — it uses the seed data and tracks prayer
counts in memory.

---

## Project structure

```
src/
  app/
    page.tsx                 Home: 3 bubbles + "This week's prayer focus"
    explore/page.tsx         Browse with filter + sub-filter + search
    category/[slug]/page.tsx Per-bubble landing page
    add-request/page.tsx     Add a prayer point (admin-gated when Supabase is on)
    api/bulletin/route.ts    Protected endpoint to refresh from the bulletin (cron)
  components/
    PrayerBubbles.tsx        The 3-bubble hero (replaces the world map)
    CategoryBubble.tsx       A single candle-lit bubble
    WeeklyPrayerFocus.tsx    One card per filter, swaps on "I prayed"
    PrayerCard.tsx           Card + candle "I prayed" mechanic
    ...
  context/PrayerContext.tsx  Loads prayers, tracks counts + lit/glowing candles
  data/
    categories.ts            The 3 filters + sub-filters (edit me to add more)
    prayerData.ts            Curated seed (mirrors the live bulletin)
  lib/
    prayers.ts               Supabase-or-seed data layer
    featured.ts              "One per category" + daily rotation
    zionFeed.ts              Bulletin scraper STUB (implement to enable cron)
    supabase.ts              Supabase client + row types
  types/index.ts
supabase/
  migrations/00001_initial_schema.sql
  seed.sql
```

### Adding ministries / sub-filters later
Edit `src/data/categories.ts` — add entries to a category's `subcategories`
array. The explore filters, the add-request form, and bubble counts all read
from that file, so nothing else needs to change.

---

## Supabase setup (optional, for persistence + auth)

1. Create a project at <https://supabase.com>.
2. **SQL Editor** → run `supabase/migrations/00001_initial_schema.sql`, then
   `supabase/seed.sql`.
3. **Project Settings → API** → copy the values into `.env.local`
   (see `.env.local.example`):

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # server-only, for the scraper
   BULLETIN_REFRESH_SECRET=...          # any random string
   ```

4. Restart `npm run dev`. The app now reads/writes the database.

**Roles & approval model (built into the RLS policies):**
- **Everyone** (even signed-out) can view *approved* prayers and tap **"I prayed"**
  — the count increments via a `SECURITY DEFINER` function, no write access needed.
- **Anyone** can *submit* a prayer request, but it is saved as **`pending`** and
  is invisible to the public until reviewed.
- **Approvers** (`role = 'approver'`) see the pending queue and **approve/reject**
  (the approve action flips `status` to `approved` via the `set_prayer_status` rpc).
- **Admins** (`role = 'admin'`) have approver rights plus delete/manage.

So the add-request form feeds a **moderation queue** — exactly the "grant certain
users the right to approve requests" model.

---

## Authentication & granting approval rights

The schema is fully wired for this; an in-app login + review page is the one
remaining piece to build when you're ready.

1. **Supabase → Authentication → Providers**: enable **Email** (magic link). To
   add Google later, enable the **Google** provider and paste an OAuth client
   ID/secret from Google Cloud Console.
2. A `profiles` row (with `role = 'member'`) is created automatically on sign-up
   (trigger in the schema).
3. **Grant approve / admin rights** — after the person has signed in once, run in
   the SQL Editor:

   ```sql
   -- let someone approve submissions
   update public.profiles set role = 'approver'
   where id = (select id from auth.users where email = 'approver@example.com');

   -- full admin (approve + delete + manage)
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

   Members cannot escalate their own role (RLS prevents it); only an admin/the
   service-role key can change roles.

**Approving requests today (no UI needed):** in the Supabase dashboard open
**Table Editor → prayer_requests**, filter `status = pending`, and set a row's
`status` to `approved`. It appears on the site immediately.

**Approving in-app later:** build a `/login` page calling
`supabase.auth.signInWithOtp({ email })` (or `signInWithOAuth({ provider: 'google' })`),
and an `/admin/review` page that lists `status = 'pending'` rows and calls
`supabase.rpc('set_prayer_status', { request_id, new_status: 'approved' })`. Gate
both with `supabase.auth.getUser()` + the `is_approver()` check. The `supabase.auth`
accessor is already exported from `src/lib/supabase.ts`.

With Supabase **off** (local dev), the form works for anyone and items show
immediately — there's no queue without a backend. With Supabase **on**,
submissions correctly land in the pending queue.

---

## Bulletin scraper (future-proofing)

`src/lib/zionFeed.ts → fetchBulletinPrayerPoints()` is a **stub**. Implement it
to fetch and parse the bulletin's Prayer Points (the headings map cleanly to our
three categories via `headingToCategory()`). Then:

- `POST /api/bulletin` with header `Authorization: Bearer <BULLETIN_REFRESH_SECRET>`
  upserts the parsed points into Supabase (uses the service-role key, server-only).
- Schedule it weekly with **Vercel Cron** (see below).

---

## Deploy to Vercel

1. Push this folder to a GitHub repo (run from `C:\ClaudeLocal\zbprayerapp`):

   ```powershell
   cd C:\ClaudeLocal\zbprayerapp
   git remote add origin https://github.com/<you>/zbprayerapp.git
   git branch -M main
   git push -u origin main
   ```

   `.env.local` is git-ignored, so your keys are never pushed.
2. <https://vercel.com> → **Add New → Project** → import the repo. Vercel
   auto-detects Next.js; no build config needed.
3. **Settings → Environment Variables**: add the same vars from `.env.local`
   (`NEXT_PUBLIC_*` for all environments; `SUPABASE_SERVICE_ROLE_KEY` and
   `BULLETIN_REFRESH_SECRET` as **server-side / sensitive**).
4. Deploy. Set the Supabase **Auth → URL Configuration → Site URL** to your
   Vercel domain so magic-link / OAuth redirects work.
5. **(Optional) Weekly bulletin refresh** — add `vercel.json`:

   ```json
   {
     "crons": [{ "path": "/api/bulletin", "schedule": "0 1 * * 1" }]
   }
   ```

   Vercel Cron calls the path on schedule; in the route, verify the
   `BULLETIN_REFRESH_SECRET` before running (already scaffolded).

---

## Notes

- `AGENTS.md` warns that this Next.js version has breaking changes vs. older
  docs. This app mirrors the known-good patterns from the sibling `nextlvlprayer`
  project on the same version.
