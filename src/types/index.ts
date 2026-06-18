/** The three top-level prayer filters. These are the bubbles on the home page. */
export type CategorySlug = "our-church" | "our-people" | "our-world";

/**
 * A category definition — drives the home-page bubbles, the explore filters,
 * and the add-request form. Subcategories act as the (future) sub-filters.
 */
export interface Category {
  slug: CategorySlug;
  title: string; // "Our People"
  tagline: string; // short description under the title
  /** The ministry umbrella this maps to, e.g. "Home Missions". */
  missionLabel: string;
  icon: string; // emoji shown in the bubble
  /** Relative bubble size weight — "Our People" is the largest. */
  weight: number;
  /** Tailwind gradient classes for the bubble. */
  gradient: string;
  /** Sub-filters. More can be added later without code changes elsewhere. */
  subcategories: Subcategory[];
}

export interface Subcategory {
  slug: string; // e.g. "tuition-ministry"
  label: string; // e.g. "Tuition Ministry"
}

export interface PrayerRequest {
  id: string;
  title: string;
  category: CategorySlug;
  /** Sub-filter slug (matches a Subcategory in the category). Optional. */
  subcategory?: string;
  description: string;
  prayerPoints: string[];
  source: string; // e.g. "Zion Bishan Bulletin"
  sourceUrl?: string;
  featured?: boolean; // eligible for the home "This week" rotation
  /** Baseline "prayed" count so candles look alive before live taps. */
  seedPrayers?: number;
  /** Bulletin date this point came from, e.g. "2026-06-15". */
  weekOf?: string;
}

export interface NewPrayerRequest {
  title: string;
  category: CategorySlug;
  subcategory: string;
  description: string;
  prayerPoints: string;
  sourceUrl: string;
}

/** Fields a user may edit inline on a prayer card (local-only for now). */
export interface PrayerCardEdits {
  title: string;
  description: string;
  prayerPoints: string[];
}
