"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePrayer } from "@/context/PrayerContext";
import PrayerCardList from "@/components/PrayerCardList";
import { ErrorState, LoadingState } from "@/components/LoadingState";
import { CATEGORY_BY_SLUG } from "@/data/categories";
import type { CategorySlug } from "@/types";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug as CategorySlug;
  const category = CATEGORY_BY_SLUG[slug];

  const { prayers, loading, error, refreshPrayers } = usePrayer();

  const inCategory = useMemo(
    () => prayers.filter((p) => p.category === slug),
    [prayers, slug]
  );

  if (!category) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <p className="text-slate-500">That filter doesn&apos;t exist.</p>
        <Link href="/" className="mt-4 inline-block text-amber-600">
          ← Back home
        </Link>
      </div>
    );
  }

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
      <section
        className={`mb-8 overflow-hidden rounded-2xl bg-gradient-to-br ${category.gradient} p-8 text-white shadow-lg`}
      >
        <div className="text-5xl">{category.icon}</div>
        <h1 className="mt-3 text-3xl font-bold">{category.title}</h1>
        <p className="mt-1 text-white/80">{category.tagline}</p>
        <p className="mt-1 text-sm text-white/70">
          {category.missionLabel} · {inCategory.length} prayer request
          {inCategory.length === 1 ? "" : "s"}
        </p>
      </section>

      {category.subcategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.subcategories.map((s) => (
            <Link
              key={s.slug}
              href={`/explore?category=${category.slug}`}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}

      <PrayerCardList
        prayers={inCategory}
        emptyMessage={`No prayer requests under ${category.title} yet.`}
      />

      <div className="mt-8">
        <Link href="/" className="text-sm font-medium text-amber-600">
          ← Back to all bubbles
        </Link>
      </div>
    </div>
  );
}
