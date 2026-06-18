"use client";

import Link from "next/link";
import { usePrayer } from "@/context/PrayerContext";
import PrayerBubbles from "@/components/PrayerBubbles";
import WeeklyPrayerFocus from "@/components/WeeklyPrayerFocus";
import { ErrorState, LoadingState } from "@/components/LoadingState";

export default function HomePage() {
  const { prayers, loading, error, refreshPrayers } = usePrayer();

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
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Light a candle.{" "}
          <span className="text-amber-500">Pray as one church.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
          Every prayer lights a candle. Pray through this week&apos;s bulletin
          points across Our Church, Our People, and Our World.
        </p>
      </section>

      <section className="mb-12">
        <PrayerBubbles className="w-full" />
      </section>

      <section className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            This week&apos;s prayer focus
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            One request from each filter — pray and the next takes its place
          </p>
        </div>
        <Link
          href="/explore"
          className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
        >
          View all →
        </Link>
      </section>

      <WeeklyPrayerFocus prayers={prayers} />

      <section className="mt-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center text-white">
        <h2 className="text-xl font-bold">Have a prayer request?</h2>
        <p className="mt-2 text-amber-100">
          Share it with the church and light a new candle.
        </p>
        <Link
          href="/add-request"
          className="mt-4 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50"
        >
          Add Prayer Request
        </Link>
      </section>
    </div>
  );
}
