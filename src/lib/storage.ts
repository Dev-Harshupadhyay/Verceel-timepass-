/** Safe localStorage wrapper — never throws (private mode / quota / SSR). */

const memory = new Map<string, string>();

function hasLS(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export const storage = {
  get(key: string): string | null {
    if (hasLS()) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        /* fall through */
      }
    }
    return memory.has(key) ? (memory.get(key) as string) : null;
  },
  set(key: string, value: string): void {
    memory.set(key, value);
    if (!hasLS()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore quota / private mode */
    }
  },
  remove(key: string): void {
    memory.delete(key);
    if (!hasLS()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
  getJSON<T>(key: string): T | null {
    const raw = storage.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setJSON(key: string, value: unknown): void {
    try {
      storage.set(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }
};

export const KEYS = {
  theme: "tp_theme",
  lang: "tp_lang",
  draft: "tp_draft_v2",
  configCache: "tp_config_v2",
  announceDismiss: "tp_announce_dismissed",
  adminTab: "tp_admin_tab",
  visits: "tp_premium_visit_logs_v1"
} as const;
