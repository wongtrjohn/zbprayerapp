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
import type { User } from "@supabase/supabase-js";
import {
  getSupabase,
  isSupabaseConfigured,
  type UserRole,
} from "@/lib/supabase";

interface AuthContextValue {
  /** Whether login is available (Supabase configured). */
  enabled: boolean;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  isApprover: boolean;
  isAdmin: boolean;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(enabled);

  // Make sure a profile row exists for this user (via a SECURITY DEFINER rpc),
  // then read their role.
  const loadRole = useCallback(async (u: User | null) => {
    if (!u) {
      setRole(null);
      return;
    }
    const sb = getSupabase();
    await sb.rpc("ensure_profile");
    const { data } = await sb
      .from("profiles")
      .select("role")
      .eq("id", u.id)
      .maybeSingle();
    setRole((data?.role as UserRole) ?? "member");
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const sb = getSupabase();
    let active = true;

    sb.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const u = data.session?.user ?? null;
      setUser(u);
      await loadRole(u);
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      await loadRole(u);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [enabled, loadRole]);

  const signInWithEmail = useCallback(async (email: string) => {
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    return { error: error?.message };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
    setUser(null);
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled,
      user,
      role,
      loading,
      isApprover: role === "approver" || role === "admin",
      isAdmin: role === "admin",
      signInWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [enabled, user, role, loading, signInWithEmail, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
