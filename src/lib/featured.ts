import { CATEGORIES } from "@/data/categories";
import type { PrayerRequest } from "@/types";

/** Whole days since the Unix epoch in the user's local time zone. */
export function daysSinceEpoch(date = new Date()): number {
  const startOfLocalDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
  return Math.floor(startOfLocalDay / 86_400_000);
}

/**
 * Pick one prayer per category for the home-page "This week's prayer focus".
 * Prefers `featured` entries, falls back to the first in each category, and
 * rotates deterministically each day so the cards refresh without a backend.
 */
export function getOnePerCategory(
  prayers: PrayerRequest[],
  date = new Date()
): PrayerRequest[] {
  const day = daysSinceEpoch(date);
  const picks: PrayerRequest[] = [];

  for (const category of CATEGORIES) {
    const inCat = prayers.filter((p) => p.category === category.slug);
    if (inCat.length === 0) continue;
    const featured = inCat.filter((p) => p.featured);
    const pool = featured.length > 0 ? featured : inCat;
    picks.push(pool[day % pool.length]);
  }

  return picks;
}

/** All prayers belonging to a category (used by the bubbles + explore). */
export function getByCategory(
  prayers: PrayerRequest[],
  category: string
): PrayerRequest[] {
  return prayers.filter((p) => p.category === category);
}
