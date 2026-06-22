import type { CategorySlug } from "@/types";

/**
 * Bulletin scraper
 * ----------------
 * Fetches the Zion Bishan weekly bulletin
 * (https://www.zionbishan.org.sg/services/english/bulletins/latest/) and parses
 * its "Prayer Points" section into structured items.
 *
 * The bulletin is server-rendered WordPress. The Prayer Points live in a
 * "spoiler" block where <h4> headings mark the category (e.g. "Our Church",
 * "Our People", "Our Denomination") and each <p class="wp-block-paragraph"> is a
 * single prayer item: a bold "Title –" followed by the prayer text.
 *
 * Called only from the /api/bulletin route (server runtime), never the browser.
 */

export interface ScrapedPrayerPoint {
  title: string;
  category: CategorySlug;
  subcategory?: string;
  description: string;
  prayerPoints: string[];
  weekOf?: string;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  nbsp: " ",
  quot: '"',
  apos: "'",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED_ENTITIES[n.toLowerCase()] ?? m);
}

/** Strip tags + decode entities + collapse whitespace. */
function clean(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Map a bulletin section heading to one of our three filters. Order matters:
 * the church's third section rotates (Our World / Our Denomination / Missions),
 * so we match the broader-world synonyms first, then people, then church.
 */
export function headingToCategory(heading: string): CategorySlug | null {
  const h = heading.toLowerCase();
  if (/world|denomination|mission|nation|partner/.test(h)) return "our-world";
  if (/people|member|congregation|flock/.test(h)) return "our-people";
  if (/church|home/.test(h)) return "our-church";
  return null;
}

/** Today's date in Singapore (YYYY-MM-DD), used as the weekly batch key. */
function singaporeDate(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
  }).format(new Date());
}

export async function fetchBulletinPrayerPoints(
  url = process.env.ZB_BULLETIN_URL ??
    "https://www.zionbishan.org.sg/services/english/bulletins/latest/"
): Promise<ScrapedPrayerPoint[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ZBPrayerApp/1.0; +https://github.com/wongtrjohn/zbprayerapp)",
    },
    // Always get the freshest bulletin.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Bulletin fetch failed: HTTP ${res.status}`);
  }
  const html = await res.text();

  // Isolate the "Prayer Points" spoiler content block.
  const titleIdx = html.search(/Prayer\s*Points<\/div>/i);
  if (titleIdx === -1) return [];
  const contentStart = html.indexOf("su-spoiler-content", titleIdx);
  if (contentStart === -1) return [];
  const nextSpoiler = html.indexOf("su-spoiler ", contentStart + 20);
  const region = html.slice(
    contentStart,
    nextSpoiler > -1 ? nextSpoiler : contentStart + 15000
  );

  const weekOf = singaporeDate();
  const items: ScrapedPrayerPoint[] = [];
  const seen = new Set<string>();
  let category: CategorySlug | null = null;

  // Walk <h4> headings and <p> items in document order.
  const re =
    /<h4[^>]*>([\s\S]*?)<\/h4>|<p class="wp-block-paragraph">([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(region))) {
    if (m[1] !== undefined) {
      category = headingToCategory(clean(m[1]));
      continue;
    }
    if (!category) continue;

    const inner = m[2];
    const strongMatch = inner.match(/<strong>([\s\S]*?)<\/strong>/i);
    let title = strongMatch
      ? clean(strongMatch[1]).replace(/[–—:-]\s*$/, "").trim()
      : "";
    const rest = strongMatch ? inner.replace(strongMatch[0], "") : inner;
    const description = clean(rest).replace(/^[–—:-]\s*/, "").trim();
    if (!title && description) title = description.split(/[.!?]/)[0].slice(0, 80);
    if (!title && !description) continue;

    const key = `${category}::${title}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      title,
      category,
      description,
      prayerPoints: [],
      weekOf,
    });
  }

  return items;
}
