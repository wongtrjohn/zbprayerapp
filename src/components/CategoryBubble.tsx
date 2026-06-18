"use client";

import Link from "next/link";
import type { Category } from "@/types";

interface CategoryBubbleProps {
  category: Category;
  /** Total prayers offered across this category (big number). */
  totalPrayers: number;
  /** How many prayer requests live in this category (subtitle). */
  requestCount: number;
  /** At least one prayer in this category has been prayed this session. */
  lit: boolean;
  /** A prayer in this category was just prayed — play the glow burst. */
  glowing: boolean;
  /** Diameter in px (Our People is largest). */
  size: number;
}

/**
 * A single home-page bubble. Mirrors the candle mechanic of the original world
 * map: dim until prayed for, then a steady flame, with a one-off glow burst the
 * moment a prayer in this category is offered.
 */
export default function CategoryBubble({
  category,
  totalPrayers,
  requestCount,
  lit,
  glowing,
  size,
}: CategoryBubbleProps) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative flex flex-col items-center"
      aria-label={`${category.title} — ${totalPrayers} prayers across ${requestCount} requests`}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Glow burst — plays once, right after a prayer in this category */}
        {glowing && (
          <>
            <span className="absolute inset-0 rounded-full bg-amber-400/25 animate-ping-slow" />
            <span className="absolute inset-2 rounded-full bg-amber-300/30 animate-pulse-glow" />
          </>
        )}

        {/* Steady halo once the category is lit */}
        {lit && (
          <span className="absolute -inset-1 rounded-full bg-amber-400/20 blur-xl" />
        )}

        {/* The bubble */}
        <div
          className={`relative flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-br ${category.gradient} text-white shadow-xl ring-4 transition-all duration-500 group-hover:scale-[1.03] ${
            lit
              ? "ring-amber-300/70"
              : "ring-white/10 grayscale-[35%] group-hover:grayscale-0"
          }`}
        >
          {/* Candle / flame */}
          <svg
            width={size * 0.18}
            height={size * 0.22}
            viewBox="0 0 24 30"
            className="mb-1"
            aria-hidden
          >
            {/* flame */}
            <path
              d="M12 1 C8 7 8 11 12 14 C16 11 16 7 12 1 Z"
              className={`transition-all duration-500 ${
                lit || glowing ? "fill-orange-200" : "fill-white/40"
              }`}
            />
            {/* candle body */}
            <rect
              x="9"
              y="14"
              width="6"
              height="13"
              rx="1.5"
              className="fill-white/85"
            />
          </svg>

          <span style={{ fontSize: size * 0.2 }} aria-hidden>
            {category.icon}
          </span>
          <span
            className="mt-1 font-bold leading-none"
            style={{ fontSize: size * 0.15 }}
          >
            {totalPrayers.toLocaleString()}
          </span>
          <span
            className="mt-0.5 font-medium text-white/80"
            style={{ fontSize: Math.max(10, size * 0.055) }}
          >
            prayers
          </span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
          {category.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {requestCount} request{requestCount === 1 ? "" : "s"} ·{" "}
          {category.missionLabel}
        </p>
      </div>
    </Link>
  );
}
