"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SessionUser = {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "patient" | "doctor";
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/appointments", label: "Appointments" },
  { href: "/doctors", label: "Doctors" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (response.ok && data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-(--line) bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
            HAMS
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition ${
                    isActive ? "text-teal-700" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : user ? (
            <>
              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 sm:block">
                {user.name} | {user.role}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700"
              >
                Log In
              </Link>
              <Link
                href="/signin"
                className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
