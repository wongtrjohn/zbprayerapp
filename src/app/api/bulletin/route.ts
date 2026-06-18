import { createClient } from "@supabase/supabase-js";
import { fetchBulletinPrayerPoints } from "@/lib/zionFeed";

/**
 * POST /api/bulletin — refresh prayer points from the latest church bulletin.
 *
 * Protected by a shared secret so only a trusted caller (e.g. a Vercel Cron job)
 * can trigger it. Uses the service-role key to upsert rows, bypassing RLS — this
 * runs server-side only and the key is never sent to the browser.
 *
 * The parser in src/lib/zionFeed.ts is currently a stub, so this endpoint is a
 * no-op until that is implemented. Wire the cron up after the parser is done.
 */
export async function POST(request: Request) {
  const secret = process.env.BULLETIN_REFRESH_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
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

  const points = await fetchBulletinPrayerPoints();
  if (points.length === 0) {
    return Response.json({
      ok: true,
      upserted: 0,
      note: "Scraper stub returned no points. Implement fetchBulletinPrayerPoints in src/lib/zionFeed.ts.",
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
  }));

  const { error } = await admin
    .from("prayer_requests")
    .upsert(rows, { onConflict: "title,week_of" });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, upserted: rows.length });
}
