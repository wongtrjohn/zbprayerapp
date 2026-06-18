"use client";

import { useMemo, useState } from "react";
import PrayerCard from "./PrayerCard";
import { CATEGORIES } from "@/data/categories";
import type { CategorySlug, PrayerRequest } from "@/types";

const LEAVE_MS = 420; // matches the exit transition below

/**
 * One prayer card per filter (Our People / Our Church / Our World). Tapping
 * "I prayed" asks to confirm, the card fades out, and the next queued request
 * in that same category animates into its place.
 */
export default function WeeklyPrayerFocus({
  prayers,
}: {
  prayers: PrayerRequest[];
}) {
  // A stable queue of prayer ids per category, in display order.
  const queues = useMemo(() => {
    const map = new Map<CategorySlug, string[]>();
    for (const c of CATEGORIES) {
      const inCat = prayers
        .filter((p) => p.category === c.slug)
        .sort((a, b) => Number(b.featured) - Number(a.featured));
      map.set(
        c.slug,
        inCat.map((p) => p.id)
      );
    }
    return map;
  }, [prayers]);

  const byId = useMemo(
    () => new Map(prayers.map((p) => [p.id, p])),
    [prayers]
  );

  // Which index of each category's queue is currently showing.
  const [cursor, setCursor] = useState<Record<string, number>>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.slug, 0]))
  );
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const handlePrayed = (category: CategorySlug, prayedId: string) => {
    setLeavingId(prayedId);
    setTimeout(() => {
      setCursor((prev) => ({ ...prev, [category]: prev[category] + 1 }));
      setLeavingId(null);
    }, LEAVE_MS);
  };

  const visible = CATEGORIES.map((c) => {
    const queue = queues.get(c.slug) ?? [];
    const idx = cursor[c.slug] ?? 0;
    const id = queue[idx];
    return { category: c, prayer: id ? byId.get(id) : undefined };
  });

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map(({ category, prayer }) => {
        if (!prayer) {
          return (
            <div
              key={category.slug}
              className="flex items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-8 text-center text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/10 dark:text-amber-200"
            >
              🙏 You&apos;ve prayed through every {category.title} request.
            </div>
          );
        }
        const leaving = leavingId === prayer.id;
        return (
          <div
            key={category.slug}
            className={`animate-card-in transition-all duration-[420ms] ease-out ${
              leaving
                ? "scale-90 -translate-y-3 opacity-0"
                : "scale-100 translate-y-0 opacity-100"
            }`}
          >
            <PrayerCard
              prayer={prayer}
              requireConfirm
              onPrayed={() => handlePrayed(category.slug, prayer.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
