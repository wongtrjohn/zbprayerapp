"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/add-request", label: "Add Request" },
];

export default function Navigation() {
  const pathname = usePathname();
  const { enabled, user, isApprover, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🕯️</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
            ZB<span className="text-amber-500">Prayer</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={pathname === link.href}
            />
          ))}

          {/* Approver-only review link */}
          {isApprover && (
            <NavLink
              href="/admin/review"
              label="Review"
              active={pathname === "/admin/review"}
            />
          )}

          {/* Auth controls (only when Supabase is configured) */}
          {enabled &&
            (user ? (
              <button
                onClick={() => signOut()}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                title={user.email ?? "Sign out"}
              >
                Sign out
              </button>
            ) : (
              <NavLink
                href="/login"
                label="Sign in"
                active={pathname === "/login"}
              />
            ))}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-amber-500 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      }`}
    >
      {label}
    </Link>
  );
}
