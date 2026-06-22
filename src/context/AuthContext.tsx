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

  // IMPORTANT: never call other Supabase methods (.rpc/.from) synchronously
  // inside onAuthStateChange — that callback holds the gotrue auth lock, and a
  // nested call that needs the same lock deadlocks the entire client (every
  // query hangs forever). So here we ONLY do synchronous state updates, and
  // load the role in a separate effect below, outside the lock.
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const sb = getSupabase();
    let active = true;

    sb.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [enabled]);

  // Load the user's role whenever the signed-in user changes. This runs OUTSIDE
  // the auth callback, so the Supabase calls don't deadlock the auth lock.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!enabled || !userId) {
      setRole(null);
      return;
    }
    let active = true;
    (async () => {
      const sb = getSupabase();
      try {
        await sb.rpc("ensure_profile");
        const { data } = await sb
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        if (active) setRole((data?.role as UserRole) ?? "member");
      } catch {
        if (active) setRole("member");
      }
    })();
    return () => {
      active = false;
    };
  }, [enabled, userId]);

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
