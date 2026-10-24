import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { verifyPassword } from "@/lib/api";

interface AuthContextValue {
  authed: boolean;
  password: string;
  loginAt: number | null;
  busy: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  /** confirms the session is still valid (used before destructive actions) */
  passwordRef: React.RefObject<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const IDLE_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  // Password lives in memory only — never in localStorage / cookies.
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loginAt, setLoginAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef("");

  const logout = useCallback(() => {
    passwordRef.current = "";
    setPassword("");
    setAuthed(false);
    setLoginAt(null);
    setError(null);
  }, []);

  const login = useCallback(async (candidate: string) => {
    const value = candidate.trim();
    if (!value) {
      setError("Password daalo.");
      return false;
    }
    setBusy(true);
    setError(null);
    const res = await verifyPassword(value);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || "Login fail");
      return false;
    }
    passwordRef.current = value;
    setPassword(value);
    setAuthed(true);
    setLoginAt(Date.now());
    return true;
  }, []);

  /* idle auto-lock */
  useEffect(() => {
    if (!authed) return;
    let timer = window.setTimeout(logout, IDLE_MS);
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(logout, IDLE_MS);
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "focus"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [authed, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ authed, password, loginAt, busy, error, login, logout, passwordRef }),
    [authed, password, loginAt, busy, error, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
