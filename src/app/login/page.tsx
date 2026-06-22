"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { enabled, user, loading, isApprover, signInWithEmail, signInWithGoogle } =
    useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Once signed in, send approvers to the review queue.
  useEffect(() => {
    if (user && isApprover) router.push("/admin/review");
  }, [user, isApprover, router]);

  const handleEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signInWithEmail(email.trim());
    setSubmitting(false);
    if (error) setError(error);
    else setSent(true);
  };

  if (!enabled) {
    return (
      <Shell>
        <p className="text-slate-600 dark:text-slate-300">
          Login isn&apos;t available because Supabase isn&apos;t configured for
          this environment. Add your Supabase keys to <code>.env.local</code>{" "}
          (locally) or the Vercel environment variables, then restart.
        </p>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <p className="text-slate-500">Loading…</p>
      </Shell>
    );
  }

  if (user) {
    return (
      <Shell>
        <p className="text-slate-700 dark:text-slate-200">
          Signed in as <span className="font-medium">{user.email}</span>.
        </p>
        {isApprover ? (
          <Link
            href="/admin/review"
            className="mt-4 inline-block rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Go to review queue →
          </Link>
        ) : (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            Your account doesn&apos;t have approver rights yet. An admin can grant
            them (see the README / setup instructions).
          </p>
        )}
      </Shell>
    );
  }

  if (sent) {
    return (
      <Shell>
        <div className="text-4xl">📧</div>
        <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Check your email
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          We sent a magic sign-in link to{" "}
          <span className="font-medium">{email}</span>. Open it in{" "}
          <strong>this same browser</strong> to finish signing in.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        For church leaders &amp; approvers. We&apos;ll email you a one-time link.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleEmail} className="mt-5 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        or
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <button
        onClick={() => signInWithGoogle()}
        className="w-full rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Continue with Google
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">
        (Google requires the Google provider enabled in Supabase.)
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800/50 sm:p-8">
        {children}
      </div>
    </div>
  );
}
