"use client";

import { useState } from "react";
import { usePrayer } from "@/context/PrayerContext";
import { useAuth } from "@/context/AuthContext";
import { getCategory, getSubcategoryLabel } from "@/data/categories";
import type { PrayerRequest } from "@/types";

interface PrayerCardProps {
  prayer: PrayerRequest;
  compact?: boolean;
  /** Ask the user to confirm before recording a prayer (weekly-focus cards). */
  requireConfirm?: boolean;
  /** Called after a confirmed prayer — used to swap the card out. */
  onPrayed?: (prayerId: string) => void;
}

function SourceLink({ prayer }: { prayer: PrayerRequest }) {
  if (prayer.sourceUrl) {
    return (
      <a
        href={prayer.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-amber-700 transition-colors hover:bg-amber-50 dark:border-slate-600 dark:text-amber-300 dark:hover:bg-slate-700"
      >
        {prayer.source} ↗
      </a>
    );
  }
  return (
    <span className="text-xs text-slate-400">Source: {prayer.source}</span>
  );
}

export default function PrayerCard({
  prayer,
  compact = false,
  requireConfirm = false,
  onPrayed,
}: PrayerCardProps) {
  const { recordPrayer, getPrayerCount, savePrayerEdits } = usePrayer();
  const { isApprover } = useAuth();
  const [prayed, setPrayed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // --- Edit state (approver/admin only; persisted via Supabase) ---
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState(prayer.title);
  const [draftDescription, setDraftDescription] = useState(prayer.description);
  const [draftPoints, setDraftPoints] = useState(prayer.prayerPoints.join("\n"));

  const count = getPrayerCount(prayer.id);
  const category = getCategory(prayer.category);
  const subLabel = getSubcategoryLabel(prayer.category, prayer.subcategory);

  const doPray = async () => {
    if (submitting) return;
    setSubmitting(true);
    setConfirming(false);
    try {
      await recordPrayer(prayer.id);
      setPrayed(true);
      onPrayed?.(prayer.id);
      if (!onPrayed) setTimeout(() => setPrayed(false), 2000);
    } catch {
      // count stays unchanged on failure
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrayClick = () => {
    if (requireConfirm) {
      setConfirming(true);
    } else {
      doPray();
    }
  };

  const startEdit = () => {
    setDraftTitle(prayer.title);
    setDraftDescription(prayer.description);
    setDraftPoints(prayer.prayerPoints.join("\n"));
    setEditing(true);
  };

  const saveEdit = async () => {
    if (saving) return;
    setSaving(true);
    setEditError(null);
    try {
      await savePrayerEdits(prayer.id, {
        title: draftTitle.trim() || prayer.title,
        description: draftDescription.trim(),
        prayerPoints: draftPoints
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean),
      });
      setEditing(false);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to save changes"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50">
      {/* Edit toggle — approvers/admins only */}
      {!editing && isApprover && (
        <button
          onClick={startEdit}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 opacity-60 transition hover:bg-slate-100 hover:text-slate-600 hover:opacity-100 dark:hover:bg-slate-700"
          aria-label="Edit prayer"
          title="Edit prayer"
        >
          ✎
        </button>
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
            {category.icon} {category.title}
          </span>
          {editing ? (
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-lg font-semibold text-slate-900 outline-none focus:border-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          ) : (
            <h3 className="pr-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {prayer.title}
            </h3>
          )}
          {subLabel && (
            <div className="mt-1 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                {subLabel}
              </span>
            </div>
          )}
        </div>
        <div className="shrink-0 text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {count}
          </div>
          <div className="text-xs text-slate-400">prayed</div>
        </div>
      </div>

      {editing ? (
        <textarea
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none focus:border-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
        />
      ) : (
        <p
          className={`text-sm leading-relaxed text-slate-600 dark:text-slate-300 ${
            compact ? "line-clamp-3" : ""
          }`}
        >
          {prayer.description}
        </p>
      )}

      {/* Prayer points */}
      {!compact && (editing || prayer.prayerPoints.length > 0) && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Prayer Points
          </h4>
          {editing ? (
            <textarea
              value={draftPoints}
              onChange={(e) => setDraftPoints(e.target.value)}
              rows={4}
              placeholder="One prayer point per line"
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none focus:border-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
          ) : (
            <ul className="space-y-1.5">
              {prayer.prayerPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Footer */}
      {editing ? (
        <div className="mt-4">
          {editError && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {editError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <SourceLink prayer={prayer} />
          </div>

          {confirming ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-slate-500">Confirm?</span>
              <button
                onClick={doPray}
                disabled={submitting}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handlePrayClick}
              disabled={submitting || prayed}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 ${
                prayed
                  ? "bg-green-600 text-white"
                  : "bg-amber-500 text-white hover:bg-amber-600 active:scale-95"
              }`}
            >
              {prayed ? "Prayed! 🕯️" : "I prayed"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
