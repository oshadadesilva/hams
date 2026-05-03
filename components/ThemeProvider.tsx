"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ThemePreference } from "@/lib/auth-shared";

type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (preference: ThemePreference) => void;
};

const themePreferences = ["system", "light", "dark"] as const;
const THEME_STORAGE_KEY = "hams-theme-preference";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: unknown): value is ThemePreference {
  return themePreferences.includes(value as ThemePreference);
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined" || !window.localStorage) {
    return "system";
  }

  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(storedPreference) ? storedPreference : "system";
}

function applyTheme(preference: ThemePreference, resolvedTheme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const resolvedTheme = themePreference === "system" ? systemTheme : themePreference;

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    window.localStorage?.setItem(THEME_STORAGE_KEY, preference);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    async function loadThemePreference() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        const savedPreference = data?.user?.themePreference;

        if (response.ok && data.success && isThemePreference(savedPreference) && isCurrent) {
          setThemePreferenceState(savedPreference);
          window.localStorage?.setItem(THEME_STORAGE_KEY, savedPreference);
        }
      } catch (error) {
        console.error(error);
      }
    }

    void loadThemePreference();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function syncTheme() {
      setSystemTheme(getSystemTheme());
    }

    mediaQuery.addEventListener("change", syncTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);

  useEffect(() => {
    applyTheme(themePreference, resolvedTheme);
  }, [resolvedTheme, themePreference]);

  const contextValue = useMemo(
    () => ({ themePreference, resolvedTheme, setThemePreference }),
    [resolvedTheme, setThemePreference, themePreference]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
