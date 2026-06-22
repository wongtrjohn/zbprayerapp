"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePrayer } from "@/context/PrayerContext";
import { getSupabase } from "@/lib/supabase";
import { rowToPrayer } from "@/lib/prayers";
import { getCategory, getSubcategoryLabel } from "@/data/categories";
import type { PrayerRequestRow } from "@/lib/supabase";
import type { PrayerRequest } from "@/types";

export default function ReviewPage() {
  const { enabled, user, loading: authLoading, isApprover } = useAuth();
  const { refreshPrayers } = usePrayer();

  const [pending, setPending] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getSupabase()
        .from("prayer_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setPending((data as PrayerRequestRow[]).map(rowToPrayer));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && isApprover) load();
  }, [enabled, isApprover, load]);

  const review = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    try {
      const { error } = await getSupabase().rpc("set_prayer_status", {
        request_id: id,
        new_status: status,
      });
      if (error) throw error;
      setPending((prev) => prev.filter((p) => p.id !== id));
      if (status === "approved") refreshPrayers(); // surface it on the public site
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  // --- Gating states ---
  if (!enabled) {
    return (
      <Wrap>
        <p className="text-slate-600 dark:text-slate-300">
          Review requires Supabase to be configured.
        </p>
      </Wrap>
    );
  }
  if (authLoading) {
    return (
      <Wrap>
        <p className="text-slate-500">Loading…</p>
      </Wrap>
    );
  }
  if (!user) {
    return (
      <Wrap>
        <p className="text-slate-700 dark:text-slate-200">
          Please sign in to review prayer requests.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
        >
          Sign in →
        </Link>
      </Wrap>
    );
  }
  if (!isApprover) {
    return (
      <Wrap>
        <p className="text-slate-700 dark:text-slate-200">
          Signed in as <span className="font-medium">{user.email}</span>, but
          your account doesn&apos;t have approver rights.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          An admin can grant them (see the setup instructions).
        </p>
      </Wrap>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Review queue
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {pending.length} request{pending.length === 1 ? "" : "s"} awaiting
            approval
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-slate-500">Loading queue…</p>
      ) : pending.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
          🎉 Nothing to review — the queue is empty.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((p) => {
            const category = getCategory(p.category);
            const sub = getSubcategoryLabel(p.category, p.subcategory);
            const busy = busyId === p.id;
            return (
              <article
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {category.icon} {category.title}
                  </span>
                  {sub && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                      {sub}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {p.description}
                </p>
                {p.prayerPoints.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {p.prayerPoints.map((pt, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => review(p.id, "approved")}
                    disabled={busy}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {busy ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={() => review(p.id, "rejected")}
                    disabled={busy}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
      {children}
    </div>
  );
}
