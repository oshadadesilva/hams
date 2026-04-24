"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { useToast } from "@/components/ToastProvider";


type SessionUser = {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "patient" | "doctor";
};

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

const navLinks = [
  // { href: "/", label: "Home" },
  { href: "/appointments", label: "Appointments" },
  { href: "/doctors", label: "Doctors" },
  { href: "/dashboard", label: "Dashboard" },
];

function isNavLinkActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const isLoggingOutRef = useRef(false);

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

  useEffect(() => {
    setIsSettingsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!settingsMenuRef.current?.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleLogout(showIdleMessage = false) {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }

      setIsSettingsOpen(false);
      setUser(null);

      if (showIdleMessage) {
        toast.error("You were logged out after 15 minutes of inactivity.");
      }

      router.push("/login");
      router.refresh();
      isLoggingOutRef.current = false;
    }
  }

  const handleIdleLogout = useEffectEvent(() => {
    void handleLogout(true);
  });

  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = window.setTimeout(() => {
        handleIdleLogout();
      }, IDLE_TIMEOUT_MS);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
      "focus",
    ];

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetIdleTimer();
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  const visibleNavLinks = navLinks.filter((link) => {
    if (link.href === "/dashboard") {
      return Boolean(user);
    }

    if (link.href === "/appointments") {
      return user?.role !== "doctor";
    }

    if (link.href === "/doctors") {
      return user?.role === "admin" || user?.role === "doctor";
    }

    return true;
  });

  return (
    <header className="sticky top-0 z-40 border-b border-(--line) bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
            HAMS
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {visibleNavLinks.map((link) => {
              const isActive = isNavLinkActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition ${isActive ? "text-teal-700" : "text-slate-600 hover:text-slate-900"
                    }`}>
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
              {/* <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700">
                Log Out
              </button> */}

              <div ref={settingsMenuRef} className="relative">
                <button
                  type="button"
                  aria-expanded={isSettingsOpen}
                  aria-haspopup="menu"
                  aria-label="Open settings menu"
                  onClick={() => setIsSettingsOpen((current) => !current)}
                  title="Settings"
                  className={`rounded-full border bg-white p-2 text-slate-700 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${isSettingsOpen
                    ? "border-teal-700 text-teal-700"
                    : "border-slate-300 hover:border-teal-700 hover:text-teal-700"
                    }`}>
                  <Settings
                    className={`h-5 w-5 transition-transform duration-200 ${isSettingsOpen ? "rotate-90" : ""
                      }`}
                  />
                </button>

                <div
                  className={`absolute right-0 top-full z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur transition duration-150 ${isSettingsOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-1 opacity-0"
                    }`}>
                  <Link
                    href="/profiles"
                    onClick={() => setIsSettingsOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-700 focus:bg-teal-50 focus:text-teal-700 focus:outline-none">
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsSettingsOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-700 focus:bg-teal-50 focus:text-teal-700 focus:outline-none">
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void handleLogout();
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-700 focus:bg-teal-50 focus:text-teal-700 focus:outline-none">
                    Log Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700">
                Log In
              </Link>
              <Link
                href="/signin"
                className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </header >
  );
}
