import { useMemo, useState } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { useLang, LangSwitch } from "@/state/LangProvider";
import { FaqAccordion, FaqFilters, FaqSearch, useFaqItems } from "@/components/Faq";
import { BrandLogo } from "@/components/BrandLogo";
import { navigate } from "@/lib/router";
import type { FaqCat } from "@/types";

export function FaqPage() {
  const { config } = useConfig();
  const { t } = useLang();
  const items = useFaqItems();
  const [cat, setCat] = useState<FaqCat | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (cat !== "all" && item.cat !== cat) return false;
      if (!q) return true;
      const hay = `${item.q.en} ${item.q.hinglish} ${item.q.hi} ${item.a.en} ${item.a.hinglish} ${item.a.hi}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, cat, query]);

  return (
    <div className="page-shell">
      <button type="button" className="page-back" onClick={() => navigate("/")}>
        <i className="fa-solid fa-arrow-left" aria-hidden="true" /> HOME
      </button>

      <div className="page-head">
        <span className="ph-ico">
          <BrandLogo size={22} />
        </span>
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <h1 className="page-title">{config.content.faqTeaserTitle}</h1>
          <div className="page-sub">{config.hero.faqSub}</div>
        </div>
      </div>

      <div className="info-toolbar">
        <FaqSearch value={query} onChange={setQuery} />
        <LangSwitch />
      </div>

      <div style={{ marginBottom: 14 }}>
        <FaqFilters active={cat} onSelect={setCat} />
      </div>

      {filtered.length ? (
        <FaqAccordion items={filtered} showCat />
      ) : (
        <div className="admin-empty">
          <i className="fa-solid fa-comment-dots" aria-hidden="true" />
          <b>Koi match nahi mila</b>
          <small>Search clear karo ya "All" select karo.</small>
        </div>
      )}

      <div className="support-note">
        <i className="fa-brands fa-telegram" aria-hidden="true" />
        <span>{t(config.info.supportNote)}</span>
      </div>

      <div style={{ marginTop: 18 }}>
        <button type="button" className="st-btn" onClick={() => navigate("/info")}>
          <i className="fa-solid fa-circle-info" aria-hidden="true" /> Full info
        </button>
      </div>
    </div>
  );
}
