"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePrayer } from "@/context/PrayerContext";
import PrayerCardList from "@/components/PrayerCardList";
import { ErrorState, LoadingState } from "@/components/LoadingState";
import { CATEGORIES, CATEGORY_BY_SLUG } from "@/data/categories";
import type { CategorySlug } from "@/types";

function ExploreContent() {
  const { prayers, loading, error, refreshPrayers } = usePrayer();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  // Pre-filter from ?category= (e.g. from a home-page bubble).
  const initialCategory = searchParams.get("category");
  const [categoryFilter, setCategoryFilter] = useState<CategorySlug | "">(
    () =>
      CATEGORIES.some((c) => c.slug === initialCategory)
        ? (initialCategory as CategorySlug)
        : ""
  );
  const [subFilter, setSubFilter] = useState("");

  const subcategories = categoryFilter
    ? CATEGORY_BY_SLUG[categoryFilter].subcategories
    : [];

  const filtered = useMemo(() => {
    return prayers.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.prayerPoints.some((pt) =>
          pt.toLowerCase().includes(search.toLowerCase())
        );
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesSub = !subFilter || p.subcategory === subFilter;
      return matchesSearch && matchesCategory && matchesSub;
    });
  }, [prayers, search, categoryFilter, subFilter]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ErrorState message={error} onRetry={refreshPrayers} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Explore Prayers
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Browse prayer points across the three filters and light candles.
        </p>
      </div>

      {/* Main filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setCategoryFilter("");
            setSubFilter("");
          }}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            categoryFilter === ""
              ? "bg-amber-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => {
              setCategoryFilter(c.slug);
              setSubFilter("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              categoryFilter === c.slug
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {c.icon} {c.title}
          </button>
        ))}
      </div>

      {/* Sub-filter row (appears once a main filter is chosen) */}
      {subcategories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSubFilter("")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              subFilter === ""
                ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                : "border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            }`}
          >
            All {CATEGORY_BY_SLUG[categoryFilter as CategorySlug].title}
          </button>
          {subcategories.map((s) => (
            <button
              key={s.slug}
              onClick={() => setSubFilter(s.slug)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                subFilter === s.slug
                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                  : "border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <input
        type="search"
        placeholder="Search prayers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />

      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Showing {filtered.length} of {prayers.length} prayers
      </p>

      <PrayerCardList
        prayers={filtered}
        emptyMessage="No prayers match your filters."
      />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <LoadingState />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
