import { useMemo, useState } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { useLang, LangSwitch } from "@/state/LangProvider";
import { FaqAccordion, FaqFilters, FaqSearch, useFaqItems, CAT_META } from "@/components/Faq";
import { BrandLogo } from "@/components/BrandLogo";
import { navigate } from "@/lib/router";
import { telegramUrl } from "@/lib/payments";
import type { FaqCat } from "@/types";

const SUB = {
  en: "Prices, payment, access and policies — everything in one place, in your language.",
  hinglish: "Price, payment, access aur policy — sab kuch ek jagah, aapki bhasha mein.",
  hi: "कीमत, भुगतान, एक्सेस और नीतियाँ — सब कुछ एक जगह, आपकी भाषा में।"
};

const TRENDING_LABEL = {
  en: "Popular right now",
  hinglish: "Sabse zyada poochhe jaate",
  hi: "सबसे ज़्यादा पूछे गए"
};

const TRENDING_IDS = ["faq-price", "faq-how-pay", "faq-devices"];

export function FaqPage() {
  const { config } = useConfig();
  const { t, lang } = useLang();
  const items = useFaqItems();
  const [cat, setCat] = useState<FaqCat | "all">("all");
  const [query, setQuery] = useState("");
  const [expandAll, setExpandAll] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (cat !== "all" && item.cat !== cat) return false;
      if (!q) return true;
      const hay = `${item.q.en} ${item.q.hinglish} ${item.q.hi} ${item.a.en} ${item.a.hinglish} ${item.a.hi}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, cat, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const it of items) c[it.cat] = (c[it.cat] || 0) + 1;
    return c;
  }, [items]);

  const trending = useMemo(
    () =>
      TRENDING_IDS.map((id) => items.find((i) => i.id === id)).filter(Boolean).slice(0, 3) as typeof items,
    [items]
  );

  const jumpTo = (id: string) => {
    setCat("all");
    setQuery("");
    setExpandAll(false);
    setFocusId(null);
    window.setTimeout(() => setFocusId(id), 40);
  };

  return (
    <div className="page-shell faq-shell">
      <button type="button" className="page-back" onClick={() => navigate("/")}>
        <i className="fa-solid fa-arrow-left" aria-hidden="true" /> HOME
      </button>

      {/* ───────── hero ───────── */}
      <header className="fx-hero">
        <span className="fx-glow" aria-hidden="true" />
        <span className="fx-sticker fx-s1" aria-hidden="true">💬</span>
        <span className="fx-sticker fx-s2" aria-hidden="true">⚡</span>
        <span className="fx-sticker fx-s3" aria-hidden="true">🎟️</span>
        <span className="fx-sticker fx-s4" aria-hidden="true">💳</span>

        <span className="fx-kicker">
          <BrandLogo size={16} /> HELP CENTER
        </span>
        <h1 className="fx-title">{config.content.faqTeaserTitle}</h1>
        <p className="fx-sub">{SUB[lang] || SUB.hinglish}</p>

        <div className="fx-stats">
          <div>
            <b>{items.length}</b>
            <small>ANSWERS</small>
          </div>
          <div>
            <b>3</b>
            <small>LANGUAGES</small>
          </div>
          <div>
            <b>{Object.keys(counts).length - 1}</b>
            <small>TOPICS</small>
          </div>
        </div>

        <div className="fx-search">
          <FaqSearch value={query} onChange={setQuery} />
          <LangSwitch />
        </div>

        {trending.length ? (
          <div className="fx-trending">
            <span className="fx-trending-label">
              <i className="fa-solid fa-fire" aria-hidden="true" /> {TRENDING_LABEL[lang] || TRENDING_LABEL.hinglish}
            </span>
            <div className="fx-trending-pills">
              {trending.map((item) => (
                <button type="button" key={item.id} className="fx-pill" onClick={() => jumpTo(item.id)}>
                  <span aria-hidden="true">{CAT_META[item.cat]?.emoji}</span>
                  {t(item.q)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {/* ───────── filters ───────── */}
      <div className="faq-toolbar">
        <FaqFilters
          active={cat}
          onSelect={(c) => {
            setCat(c);
            setFocusId(null);
          }}
          counts={counts}
        />
        <button type="button" className="faq-expand" aria-pressed={expandAll} onClick={() => setExpandAll((v) => !v)}>
          <i className={`fa-solid ${expandAll ? "fa-compress" : "fa-expand"}`} aria-hidden="true" />
          {expandAll ? "Sab band karo" : "Sare kholo"}
        </button>
      </div>

      {query.trim() ? (
        <div className="fq-result-line">
          <b>{filtered.length}</b> {lang === "hi" ? "नतीजे" : "results"} · “{query.trim()}”
        </div>
      ) : null}

      {filtered.length ? (
        <FaqAccordion items={filtered} showCat expandAll={expandAll} query={query} focusId={focusId} />
      ) : (
        <div className="admin-empty">
          <i className="fa-solid fa-comment-dots" aria-hidden="true" />
          <b>Koi match nahi mila</b>
          <small>Search clear karo ya "All" select karo — ya seedha Telegram par poochh lo.</small>
        </div>
      )}

      {/* ───────── help ───────── */}
      <div className="faq-help">
        <div className="fh-ico">
          <i className="fa-solid fa-headset" aria-hidden="true" />
        </div>
        <div className="fh-txt">
          <b>Answer nahi mila? Seedha poochh lo 👋</b>
          <span>{t(config.info.supportNote)}</span>
        </div>
        <a className="fh-cta" href={telegramUrl(config.links.telegram)} target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-telegram" aria-hidden="true" /> TELEGRAM
        </a>
      </div>

      <div className="fx-foot-actions">
        <button type="button" className="st-btn primary" onClick={() => navigate("/")}>
          <i className="fa-solid fa-bag-shopping" aria-hidden="true" /> Plans dekho
        </button>
        <button type="button" className="st-btn" onClick={() => navigate("/info")}>
          <i className="fa-solid fa-circle-info" aria-hidden="true" /> Full info
        </button>
      </div>
    </div>
  );
}
