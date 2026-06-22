"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { usePrayer } from "@/context/PrayerContext";
import { CATEGORIES, CATEGORY_BY_SLUG } from "@/data/categories";
import type { CategorySlug } from "@/types";

export default function AddPrayerRequestForm() {
  const router = useRouter();
  const { addPrayerRequest } = usePrayer();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategorySlug>(CATEGORIES[0].slug);

  const subcategories = useMemo(
    () => CATEGORY_BY_SLUG[category].subcategories,
    [category]
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await addPrayerRequest({
        title: formData.get("title") as string,
        category: formData.get("category") as CategorySlug,
        subcategory: (formData.get("subcategory") as string) ?? "",
        description: formData.get("description") as string,
        prayerPoints: formData.get("prayerPoints") as string,
        sourceUrl: formData.get("sourceUrl") as string,
      });

      setSubmitted(true);
      form.reset();

      setTimeout(() => {
        router.push("/explore");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save prayer request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
        <div className="text-4xl mb-3">🕯️</div>
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
          Prayer request submitted!
        </h3>
        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
          An approver will review it shortly. Once approved, it lights a candle
          in its bubble for the whole church.
        </p>
      </div>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
  const labelClass =
    "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          disabled={submitting}
          placeholder="e.g. Pray for the tuition ministry"
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className={labelClass}>
            Filter
          </label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategorySlug)}
            disabled={submitting}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.icon} {c.title} — {c.missionLabel}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="subcategory" className={labelClass}>
            Sub-filter
          </label>
          <select
            id="subcategory"
            name="subcategory"
            disabled={submitting}
            className={inputClass}
          >
            <option value="">— None —</option>
            {subcategories.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          disabled={submitting}
          rows={3}
          placeholder="Brief description of the prayer need..."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="prayerPoints" className={labelClass}>
          Prayer Points
        </label>
        <textarea
          id="prayerPoints"
          name="prayerPoints"
          required
          disabled={submitting}
          rows={4}
          placeholder="One prayer point per line..."
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-400">
          Enter each prayer point on a new line
        </p>
      </div>

      <div>
        <label htmlFor="sourceUrl" className={labelClass}>
          Source URL (optional)
        </label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          disabled={submitting}
          placeholder="https://www.zionbishan.org.sg/..."
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Add Prayer Request"}
      </button>
    </form>
  );
}
