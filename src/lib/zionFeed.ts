import type { CategorySlug } from "@/types";

/**
 * Bulletin scraper stub
 * ----------------------
 * The Zion Bishan weekly bulletin
 * (https://www.zionbishan.org.sg/services/english/bulletins/latest/) publishes
 * its "Prayer Points" already grouped under exactly our three headings —
 * "Our Church", "Our People" and "Our World".
 *
 * This module is the seam where a server-side fetch + parse lives. It is called
 * only from the /api/bulletin route (server runtime), never from the browser,
 * so it is safe to use the service-role key there to upsert into Supabase.
 *
 * It is intentionally a STUB: the real HTML structure should be confirmed and
 * the parser hardened before enabling the weekly cron. See README → "Bulletin
 * scraper" for the recommended approach (fetch HTML, map the three headings to
 * category slugs, diff against existing rows, upsert new points).
 */

export interface ScrapedPrayerPoint {
  title: string;
  category: CategorySlug;
  subcategory?: string;
  description: string;
  prayerPoints: string[];
  weekOf?: string;
}

/** Map the bulletin's section heading text to a category slug. */
export function headingToCategory(heading: string): CategorySlug | null {
  const h = heading.trim().toLowerCase();
  if (h.includes("our church")) return "our-church";
  if (h.includes("our people")) return "our-people";
  if (h.includes("our world")) return "our-world";
  return null;
}

/**
 * Fetch and parse the latest bulletin into structured prayer points.
 *
 * TODO: Replace the placeholder below with a real parse once the bulletin HTML
 * has been inspected. A lightweight approach:
 *   1. const html = await fetch(url).then((r) => r.text());
 *   2. Locate the "Prayer Points" section.
 *   3. For each "Our Church / Our People / Our World" heading, collect the
 *      following list items / paragraphs.
 *   4. Map heading -> category via headingToCategory(), build ScrapedPrayerPoint[].
 *
 * Consider a small HTML parser (e.g. `node-html-parser`) rather than regex.
 */
export async function fetchBulletinPrayerPoints(
  url = process.env.ZB_BULLETIN_URL ??
    "https://www.zionbishan.org.sg/services/english/bulletins/latest/"
): Promise<ScrapedPrayerPoint[]> {
  // Touch `url` so the stub compiles cleanly with noUnusedParameters-style lints.
  void url;
  // Not yet implemented — return empty so callers no-op safely.
  return [];
}
