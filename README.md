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

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
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

**Access model (built into the RLS policies):**
- Anyone (even signed-out) can view prayers and tap **"I prayed"** — the count
  increments through a `SECURITY DEFINER` function, so no write access is needed.
- Only **admins** can add/edit/delete prayer points.

---

## Authentication (public + admin login)

The schema is already wired for this; the login UI is the one remaining piece to
build when you're ready.

1. **Supabase → Authentication → Providers**: enable **Email** (magic link). To
   add Google later, enable the **Google** provider and paste in an OAuth client
   ID/secret from Google Cloud Console.
2. A `profiles` row is created automatically on sign-up (trigger in the schema),
   with `is_admin = false`.
3. **Make yourself an admin** — after signing in once, run in the SQL Editor:

   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```

4. To build the login UI, add an `/login` page that calls
   `supabase.auth.signInWithOtp({ email })` (magic link) or
   `supabase.auth.signInWithOAuth({ provider: 'google' })`, and gate the
   `/add-request` page behind `supabase.auth.getUser()` + `profiles.is_admin`.
   The `supabase.auth` accessor is already exported from `src/lib/supabase.ts`.

Until then, with Supabase **off** the add-request form works locally for anyone;
with Supabase **on**, inserts are rejected for non-admins by RLS.

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

1. Push this folder to a GitHub repo.
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
