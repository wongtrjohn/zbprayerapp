"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchPrayerRequests,
  incrementPrayerCount,
  insertPrayerRequest,
} from "@/lib/prayers";
import type { NewPrayerRequest, PrayerCardEdits, PrayerRequest } from "@/types";

interface PrayerContextValue {
  prayers: PrayerRequest[];
  prayerCounts: Record<string, number>;
  /** Markers mid-celebration (animated glow burst right after "I prayed"). */
  glowingPrayerIds: Set<string>;
  /** Markers the user has prayed for this session — stay steadily lit. */
  litPrayerIds: Set<string>;
  loading: boolean;
  error: string | null;
  addPrayerRequest: (request: NewPrayerRequest) => Promise<void>;
  /** Local-only edit (no persistence yet — permissions/DB come later). */
  updatePrayerLocal: (prayerId: string, edits: PrayerCardEdits) => void;
  recordPrayer: (prayerId: string) => Promise<void>;
  getPrayerCount: (prayerId: string) => number;
  refreshPrayers: () => Promise<void>;
}

const PrayerContext = createContext<PrayerContextValue | null>(null);

export function PrayerProvider({ children }: { children: ReactNode }) {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [prayerCounts, setPrayerCounts] = useState<Record<string, number>>({});
  const [glowingPrayerIds, setGlowingPrayerIds] = useState<Set<string>>(
    new Set()
  );
  const [litPrayerIds, setLitPrayerIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrayers = useCallback(async () => {
    try {
      setError(null);
      const { prayers: loaded, counts } = await fetchPrayerRequests();
      setPrayers(loaded);
      setPrayerCounts(counts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load prayer requests"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrayers();
  }, [loadPrayers]);

  const addPrayerRequest = useCallback(async (request: NewPrayerRequest) => {
    const newPrayer = await insertPrayerRequest(request);
    // With Supabase, submissions are queued as `pending` (returns null) and stay
    // hidden until an approver publishes them. Locally (no backend) the new
    // prayer is returned and shown immediately.
    if (!newPrayer) return;
    setPrayers((prev) => [newPrayer, ...prev]);
    setPrayerCounts((prev) => ({ ...prev, [newPrayer.id]: 0 }));
  }, []);

  const updatePrayerLocal = useCallback(
    (prayerId: string, edits: PrayerCardEdits) => {
      setPrayers((prev) =>
        prev.map((p) => (p.id === prayerId ? { ...p, ...edits } : p))
      );
    },
    []
  );

  const recordPrayer = useCallback(async (prayerId: string) => {
    const newCount = await incrementPrayerCount(prayerId);
    setPrayerCounts((prev) => ({ ...prev, [prayerId]: newCount }));

    // Light the candle permanently (steady flame) and play a one-off glow burst.
    setLitPrayerIds((prev) => new Set(prev).add(prayerId));
    setGlowingPrayerIds((prev) => new Set(prev).add(prayerId));

    setTimeout(() => {
      setGlowingPrayerIds((prev) => {
        const next = new Set(prev);
        next.delete(prayerId);
        return next;
      });
    }, 3000);
  }, []);

  const getPrayerCount = useCallback(
    (prayerId: string) => prayerCounts[prayerId] ?? 0,
    [prayerCounts]
  );

  const value = useMemo(
    () => ({
      prayers,
      prayerCounts,
      glowingPrayerIds,
      litPrayerIds,
      loading,
      error,
      addPrayerRequest,
      updatePrayerLocal,
      recordPrayer,
      getPrayerCount,
      refreshPrayers: loadPrayers,
    }),
    [
      prayers,
      prayerCounts,
      glowingPrayerIds,
      litPrayerIds,
      loading,
      error,
      addPrayerRequest,
      updatePrayerLocal,
      recordPrayer,
      getPrayerCount,
      loadPrayers,
    ]
  );

  return (
    <PrayerContext.Provider value={value}>{children}</PrayerContext.Provider>
  );
}

export function usePrayer() {
  const context = useContext(PrayerContext);
  if (!context) {
    throw new Error("usePrayer must be used within a PrayerProvider");
  }
  return context;
}
