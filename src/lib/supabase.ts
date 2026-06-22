import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

export const supabase = {
  from: (...args: Parameters<SupabaseClient["from"]>) =>
    getSupabase().from(...args),
  rpc: (...args: Parameters<SupabaseClient["rpc"]>) =>
    getSupabase().rpc(...args),
  auth: {
    get instance() {
      return getSupabase().auth;
    },
  },
};

export type PrayerRequestRow = {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  description: string;
  prayer_points: string[];
  source: string;
  source_url: string | null;
  featured: boolean;
  prayer_count: number;
  week_of: string | null;
  status: "pending" | "approved" | "rejected";
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};
