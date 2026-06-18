import type { Category, CategorySlug } from "@/types";

/**
 * The three main filters. Order here = display order.
 *
 * Sub-filters are seeded with the ministries you gave; add more entries to a
 * category's `subcategories` array as the church's list grows — nothing else
 * needs to change (explore filters, the add-request form, and bubble counts
 * all read from this file).
 *
 * `weight` controls bubble size on the home page. "Our People" is intentionally
 * the largest, per the brief.
 */
export const CATEGORIES: Category[] = [
  {
    slug: "our-people",
    title: "Our People",
    tagline: "Church leaders & community prayer requests",
    missionLabel: "Our People",
    icon: "🙏",
    weight: 1.0, // largest bubble
    gradient: "from-amber-500 to-orange-600",
    subcategories: [
      { slug: "church-leaders", label: "Church Leaders" },
      { slug: "community", label: "Community Requests" },
    ],
  },
  {
    slug: "our-church",
    title: "Our Church",
    tagline: "Home missions & church ministries",
    missionLabel: "Home Missions",
    icon: "⛪",
    weight: 0.82,
    gradient: "from-sky-500 to-indigo-600",
    subcategories: [
      { slug: "tuition-ministry", label: "Tuition Ministry" },
      { slug: "terusan-ministry", label: "Terusan Ministry" },
      { slug: "events", label: "Events" },
    ],
  },
  {
    slug: "our-world",
    title: "Our World",
    tagline: "Foreign missions & mission partners",
    missionLabel: "Foreign Missions",
    icon: "🌏",
    weight: 0.82,
    gradient: "from-emerald-500 to-teal-600",
    subcategories: [{ slug: "mission-partners", label: "Mission Partners" }],
  },
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, Category> =
  Object.fromEntries(CATEGORIES.map((c) => [c.slug, c])) as Record<
    CategorySlug,
    Category
  >;

export function getCategory(slug: CategorySlug): Category {
  return CATEGORY_BY_SLUG[slug];
}

export function getSubcategoryLabel(
  category: CategorySlug,
  subSlug?: string
): string | undefined {
  if (!subSlug) return undefined;
  return CATEGORY_BY_SLUG[category]?.subcategories.find(
    (s) => s.slug === subSlug
  )?.label;
}
