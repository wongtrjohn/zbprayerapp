import { createClient } from "@supabase/supabase-js";
import { fetchBulletinPrayerPoints } from "@/lib/zionFeed";

// Always run fresh on the server (no caching of the import).
export const dynamic = "force-dynamic";

/**
 * /api/bulletin — import prayer points from the latest church bulletin into the
 * moderation queue (as `pending`, so an approver still publishes them).
 *
 * Triggered weekly by Vercel Cron (which sends a GET with
 * `Authorization: Bearer <CRON_SECRET>`), or manually via POST with
 * `Authorization: Bearer <BULLETIN_REFRESH_SECRET>`. Either secret is accepted.
 *
 * Uses the service-role key to upsert (bypassing RLS) — server-side only; the
 * key is never sent to the browser. Upsert key is (title, week_of), so re-runs
 * in the same week are idempotent and never un-approve an already-reviewed row.
 */
async function handle(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const manualSecret = process.env.BULLETIN_REFRESH_SECRET;
  const auth = request.headers.get("authorization");
  const ok =
    (cronSecret && auth === `Bearer ${cronSecret}`) ||
    (manualSecret && auth === `Bearer ${manualSecret}`);
  if (!ok) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json(
      { error: "Supabase service credentials not configured" },
      { status: 500 }
    );
  }

  let points;
  try {
    points = await fetchBulletinPrayerPoints();
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Bulletin fetch failed" },
      { status: 502 }
    );
  }

  if (points.length === 0) {
    return Response.json({
      ok: true,
      imported: 0,
      note: "No prayer points found in the bulletin (structure may have changed).",
    });
  }

  const admin = createClient(url, serviceKey);
  const rows = points.map((p) => ({
    title: p.title,
    category: p.category,
    subcategory: p.subcategory ?? null,
    description: p.description,
    prayer_points: p.prayerPoints,
    source: "Zion Bishan Bulletin",
    source_url: process.env.ZB_BULLETIN_URL ?? null,
    week_of: p.weekOf ?? null,
    // status is intentionally omitted → new rows default to 'pending';
    // existing (already-reviewed) rows keep their status on conflict update.
  }));

  const { error } = await admin
    .from("prayer_requests")
    .upsert(rows, { onConflict: "title,week_of" });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const byCategory = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});

  return Response.json({
    ok: true,
    imported: rows.length,
    weekOf: rows[0]?.week_of ?? null,
    byCategory,
  });
}

export const GET = handle;
export const POST = handle;
