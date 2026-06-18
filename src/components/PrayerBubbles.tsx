"use client";

import { useMemo } from "react";
import { usePrayer } from "@/context/PrayerContext";
import { CATEGORIES } from "@/data/categories";
import CategoryBubble from "./CategoryBubble";

const BASE_SIZE = 220; // px diameter for weight 1.0 (Our People)

/**
 * The home-page hero: three candle-lit bubbles, one per filter, replacing the
 * world map. Each bubble aggregates the candle state of all prayers in its
 * category — total prayers, request count, and whether any are lit/glowing.
 */
export default function PrayerBubbles({
  className = "",
}: {
  className?: string;
}) {
  const { prayers, getPrayerCount, litPrayerIds, glowingPrayerIds } =
    usePrayer();

  const stats = useMemo(() => {
    return CATEGORIES.map((category) => {
      const inCat = prayers.filter((p) => p.category === category.slug);
      const totalPrayers = inCat.reduce(
        (sum, p) => sum + getPrayerCount(p.id),
        0
      );
      const lit = inCat.some((p) => litPrayerIds.has(p.id));
      const glowing = inCat.some((p) => glowingPrayerIds.has(p.id));
      return {
        category,
        totalPrayers,
        requestCount: inCat.length,
        lit,
        glowing,
      };
    });
  }, [prayers, getPrayerCount, litPrayerIds, glowingPrayerIds]);

  const grandTotal = stats.reduce((s, x) => s + x.totalPrayers, 0);

  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 sm:p-10 ${className}`}
    >
      <div className="flex flex-wrap items-end justify-center gap-8 sm:gap-12">
        {stats.map(({ category, totalPrayers, requestCount, lit, glowing }) => (
          <CategoryBubble
            key={category.slug}
            category={category}
            totalPrayers={totalPrayers}
            requestCount={requestCount}
            lit={lit}
            glowing={glowing}
            size={Math.round(BASE_SIZE * category.weight)}
          />
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-amber-600 dark:text-amber-400">
          {grandTotal.toLocaleString()}
        </span>{" "}
        prayers offered · tap a bubble to pray through its requests 🕯️
      </p>
    </div>
  );
}
