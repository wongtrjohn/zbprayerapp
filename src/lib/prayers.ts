import { supabase, type PrayerRequestRow } from "@/lib/supabase";
import { curatedPrayers } from "@/data/prayerData";
import type {
  CategorySlug,
  NewPrayerRequest,
  PrayerCardEdits,
  PrayerRequest,
} from "@/types";

/**
 * When Supabase env vars are absent we run entirely on the curated dataset.
 * This lets the app run locally with no backend, and is also the offline
 * fallback until the bulletin scraper has populated the database.
 */
function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Local prayer counts used when running without Supabase, seeded from the dataset. */
const localCounts: Record<string, number> = Object.fromEntries(
  curatedPrayers.map((p) => [p.id, p.seedPrayers ?? 0])
);

export function rowToPrayer(row: PrayerRequestRow): PrayerRequest {
  return {
    id: row.id,
    title: row.title,
    category: row.category as CategorySlug,
    subcategory: row.subcategory ?? undefined,
    description: row.description,
    prayerPoints: row.prayer_points,
    source: row.source,
    sourceUrl: row.source_url ?? undefined,
    featured: row.featured,
    weekOf: row.week_of ?? undefined,
  };
}

export async function fetchPrayerRequests(): Promise<{
  prayers: PrayerRequest[];
  counts: Record<string, number>;
}> {
  if (!isSupabaseConfigured()) {
    return {
      prayers: curatedPrayers,
      counts: { ...localCounts },
    };
  }

  // Public feed: approved requests only. (Approvers see the full queue via the
  // Supabase dashboard, or a future in-app review page.) RLS also enforces this.
  const { data, error } = await supabase
    .from("prayer_requests")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data as PrayerRequestRow[];
  return {
    prayers: rows.map(rowToPrayer),
    counts: Object.fromEntries(rows.map((r) => [r.id, r.prayer_count])),
  };
}

export async function insertPrayerRequest(
  request: NewPrayerRequest
): Promise<PrayerRequest | null> {
  const prayerPoints = request.prayerPoints
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  if (!isSupabaseConfigured()) {
    return {
      id: `local-${Date.now()}`,
      title: request.title,
      category: request.category,
      subcategory: request.subcategory || undefined,
      description: request.description,
      prayerPoints,
      source: "Community Request",
      sourceUrl: request.sourceUrl || undefined,
      featured: false,
    };
  }

  // Submit into the moderation queue. We deliberately do NOT .select() the row
  // back: it is created as `pending`, and the public read policy only exposes
  // `approved` rows, so the submitter cannot read it yet. Returning null means
  // "queued for approval — not visible until an approver publishes it".
  const { error } = await supabase.from("prayer_requests").insert({
    title: request.title,
    category: request.category,
    subcategory: request.subcategory || null,
    description: request.description,
    prayer_points: prayerPoints,
    source: "Community Request",
    source_url: request.sourceUrl || null,
    featured: false,
    prayer_count: 0,
    status: "pending",
  });

  if (error) throw error;
  return null;
}

/**
 * Persist an edit to a prayer request. With Supabase this writes to the DB and
 * is enforced by RLS — only approvers/admins are allowed to update (the
 * "Approvers can update requests" policy). Without Supabase it is a no-op and
 * the change stays local (dev/demo mode).
 */
export async function updatePrayerRequest(
  prayerId: string,
  edits: PrayerCardEdits
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from("prayer_requests")
    .update({
      title: edits.title,
      description: edits.description,
      prayer_points: edits.prayerPoints,
    })
    .eq("id", prayerId);

  if (error) throw error;
}

export async function incrementPrayerCount(prayerId: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    localCounts[prayerId] = (localCounts[prayerId] ?? 0) + 1;
    return localCounts[prayerId];
  }

  const { data, error } = await supabase.rpc("increment_prayer_count", {
    request_id: prayerId,
  });

  if (error) throw error;
  return data as number;
}
