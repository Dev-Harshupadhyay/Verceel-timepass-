import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_CONFIG, normalize } from "@/config";
import { fetchPublicConfig } from "@/lib/api";
import { storage, KEYS } from "@/lib/storage";
import type { Config } from "@/types";
import { useTheme } from "./ThemeProvider";

export type ConfigSource = "defaults" | "cache" | "live";

interface ConfigContextValue {
  config: Config;
  source: ConfigSource;
  configured: boolean;
  loading: boolean;
  error: string | null;
  revision: number;
  updatedAt: string | null;
  refresh: () => Promise<void>;
  /** transient preview applied on this device only */
  applyPreview: (config: Config) => void;
  clearPreview: () => void;
  previewing: boolean;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

function readCache(): Config | null {
  const cached = storage.getJSON<unknown>(KEYS.configCache);
  if (!cached) return null;
  try {
    return normalize(cached).config;
  } catch {
    return null;
  }
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { setGlobalDefault } = useTheme();

  const initial = useRef<Config | null>(readCache());
  const [config, setConfig] = useState<Config>(initial.current || DEFAULT_CONFIG);
  const [source, setSource] = useState<ConfigSource>(initial.current ? "cache" : "defaults");
  const [configured, setConfigured] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const liveRef = useRef<Config>(initial.current || DEFAULT_CONFIG);

  const applyToTheme = useCallback(
    (cfg: Config) => {
      setGlobalDefault(cfg.appearance.defaultTheme, cfg.appearance.darkTheme);
    },
    [setGlobalDefault]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPublicConfig();
      if (res.data) {
        const { config: normalized } = normalize(res.data);
        liveRef.current = normalized;
        setConfig((prev) => (previewing ? prev : normalized));
        setSource("live");
        setConfigured(true);
        setError(null);
        storage.setJSON(KEYS.configCache, normalized);
        applyToTheme(normalized);
      } else {
        setConfigured(!!res.configured);
        if (res.error) setError(res.message || "Live config read nahi ho paya — defaults chal rahe hain.");
        else if (res.configured) setConfigured(true);
        if (!previewing) {
          setConfig(liveRef.current);
          setSource(initial.current ? "cache" : "defaults");
        }
        applyToTheme(liveRef.current);
      }
    } catch {
      setError("Server se connect nahi ho paya — saved/default content dikh raha hai.");
      applyToTheme(liveRef.current);
    } finally {
      setLoading(false);
    }
  }, [applyToTheme, previewing]);

  useEffect(() => {
    applyToTheme(liveRef.current);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreview = useCallback((next: Config) => {
    setConfig(next);
    setPreviewing(true);
  }, []);

  const clearPreview = useCallback(() => {
    setConfig(liveRef.current);
    setPreviewing(false);
  }, []);

  /** called after a successful publish */
  const commitLive = useCallback((next: Config) => {
    liveRef.current = next;
    setConfig(next);
    setPreviewing(false);
    setSource("live");
    setConfigured(true);
    setError(null);
    storage.setJSON(KEYS.configCache, next);
    applyToTheme(next);
  }, [applyToTheme]);

  const value = useMemo<ConfigContextValue & { commitLive: (c: Config) => void; live: Config }>(
    () => ({
      config,
      source,
      configured,
      loading,
      error,
      revision: config.revision || 0,
      updatedAt: config.updatedAt || null,
      refresh,
      applyPreview,
      clearPreview,
      previewing,
      commitLive,
      live: liveRef.current
    }),
    [config, source, configured, loading, error, refresh, applyPreview, clearPreview, previewing, commitLive]
  );

  return <ConfigContext.Provider value={value as ConfigContextValue}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ConfigContextValue & { commitLive: (c: Config) => void; live: Config } {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used inside ConfigProvider");
  return ctx as ConfigContextValue & { commitLive: (c: Config) => void; live: Config };
}
