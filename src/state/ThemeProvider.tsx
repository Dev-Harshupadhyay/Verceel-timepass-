import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { storage, KEYS } from "@/lib/storage";
import { THEMES, themeMeta, isDarkTheme } from "@/config";
import type { ThemeId } from "@/types";

const VALID = THEMES.map((t) => t.id);
/** what the ☀️/🌙 toggle switches a dark theme to */
const LIGHT_FALLBACK: ThemeId = "pearl";

interface ThemeContextValue {
  theme: ThemeId;
  isDark: boolean;
  /** visitor has explicitly picked a theme (localStorage) */
  explicit: boolean;
  globalDefault: ThemeId;
  darkTheme: ThemeId;
  setTheme: (id: string, opts?: { persist?: boolean }) => void;
  toggle: () => ThemeId;
  setGlobalDefault: (id: ThemeId, dark?: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSaved(): ThemeId | null {
  const saved = storage.get(KEYS.theme);
  return saved && VALID.includes(saved) ? (saved as ThemeId) : null;
}

function applyToDocument(id: ThemeId, animate: boolean) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-anim");
    window.setTimeout(() => root.classList.remove("theme-anim"), 420);
  }
  root.setAttribute("data-theme", id);
  root.style.colorScheme = isDarkTheme(id) ? "dark" : "light";
  const meta = document.getElementById("themeColorMeta");
  if (meta) meta.setAttribute("content", themeMeta(id).meta);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const saved = useRef<ThemeId | null>(readSaved());

  const [theme, setThemeState] = useState<ThemeId>(saved.current || "obsidian");
  const [explicit, setExplicit] = useState<boolean>(!!saved.current);
  const [globalDefault, setGlobalDefaultState] = useState<ThemeId>("obsidian");
  const [darkTheme, setDarkThemeState] = useState<ThemeId>("obsidian");

  /* keep <html> in sync on first mount */
  useEffect(() => {
    applyToDocument(theme, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((id: string, opts: { persist?: boolean } = {}) => {
    const next = (VALID.includes(id) ? id : "obsidian") as ThemeId;
    const persist = opts.persist !== false;
    applyToDocument(next, true);
    setThemeState(next);
    if (persist) {
      storage.set(KEYS.theme, next);
      setExplicit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setGlobalDefault = useCallback((id: ThemeId, dark?: ThemeId) => {
    setGlobalDefaultState(VALID.includes(id) ? id : "obsidian");
    if (dark && VALID.includes(dark)) setDarkThemeState(dark);
  }, []);

  /** first-time visitors follow the admin's published default */
  useEffect(() => {
    if (!explicit && globalDefault !== theme) applyToDocument(globalDefault, true);
    if (!explicit && globalDefault !== theme) setThemeState(globalDefault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalDefault, explicit]);

  const toggle = useCallback((): ThemeId => {
    const next = isDarkTheme(theme) ? LIGHT_FALLBACK : darkTheme;
    setTheme(next);
    return next;
  }, [theme, darkTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: isDarkTheme(theme),
      explicit,
      globalDefault,
      darkTheme,
      setTheme,
      toggle,
      setGlobalDefault
    }),
    [theme, explicit, globalDefault, darkTheme, setTheme, toggle, setGlobalDefault]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
