import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { storage, KEYS } from "@/lib/storage";
import type { Lang, Tri } from "@/types";

const LANGS: Lang[] = ["en", "hinglish", "hi"];

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  hinglish: "Hinglish",
  hi: "हिन्दी"
};

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (value: Tri | string | undefined) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

function initialLang(): Lang {
  const saved = storage.get(KEYS.lang);
  if (saved && LANGS.includes(saved as Lang)) return saved as Lang;
  return "hinglish";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    const safe = LANGS.includes(next) ? next : "hinglish";
    setLangState(safe);
    storage.set(KEYS.lang, safe);
  }, []);

  const t = useCallback(
    (value: Tri | string | undefined): string => {
      if (!value) return "";
      if (typeof value === "string") return value;
      const primary = value[lang];
      if (primary) return primary;
      return value.hinglish || value.en || value.hi || "";
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          title={LANG_LABEL[l]}
        >
          {compact ? l.toUpperCase() : LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
