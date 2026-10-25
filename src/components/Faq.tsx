import { useEffect, useMemo, useState } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { useLang } from "@/state/LangProvider";
import type { FaqCat, FaqItem } from "@/types";

const CAT_LABEL: Record<FaqCat, string> = {
  pricing: "Pricing",
  payment: "Payment",
  access: "Access",
  support: "Support",
  policy: "Policy"
};

export function useFaqItems(): FaqItem[] {
  const { config } = useConfig();
  return useMemo(() => (config.faq || []).filter((f) => f.active), [config.faq]);
}

const ALL = "__all__";

export function FaqAccordion({
  items,
  showCat = false,
  limit,
  expandAll = false
}: {
  items: FaqItem[];
  showCat?: boolean;
  limit?: number;
  expandAll?: boolean;
}) {
  const { t } = useLang();
  const [openId, setOpenId] = useState<string | null>(expandAll ? ALL : null);
  const visible = typeof limit === "number" ? items.slice(0, limit) : items;

  useEffect(() => {
    setOpenId(expandAll ? ALL : null);
  }, [expandAll]);

  if (!visible.length) {
    return <p className="st-note">FAQ jaldi aa raha hai.</p>;
  }

  return (
    <div className="faq-list">
      {visible.map((item, i) => {
        const open = openId === ALL || openId === item.id;
        return (
          <div className="faq-item" data-open={open} key={item.id}>
            <button
              type="button"
              className="faq-q"
              aria-expanded={open}
              aria-controls={`faq-panel-${item.id}`}
              id={`faq-btn-${item.id}`}
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <span className="fq-mark" aria-hidden="true">
                <i className="fa-solid fa-chevron-down" />
              </span>
              <span style={{ flex: "1 1 auto" }}>{t(item.q) || `Question ${i + 1}`}</span>
              {showCat ? <span className="faq-cat">{CAT_LABEL[item.cat]}</span> : null}
            </button>
            <div
              className="faq-a"
              id={`faq-panel-${item.id}`}
              role="region"
              aria-labelledby={`faq-btn-${item.id}`}
              aria-hidden={!open}
            >
              <div>
                <p>{t(item.a)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FaqSearch({
  value,
  onChange
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ position: "relative", display: "block", flex: "1 1 200px" }}>
      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        Search FAQ
      </span>
      <i
        className="fa-solid fa-magnifying-glass"
        aria-hidden="true"
        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, opacity: 0.6 }}
      />
      <input
        className="st-input"
        style={{ paddingLeft: 32 }}
        type="search"
        placeholder="Search question…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function FaqFilters({
  active,
  onSelect,
  counts
}: {
  active: FaqCat | "all";
  onSelect: (cat: FaqCat | "all") => void;
  counts?: Record<string, number>;
}) {
  const cats: (FaqCat | "all")[] = ["all", "pricing", "payment", "access", "support", "policy"];
  return (
    <div className="seg faq-filters" role="group" aria-label="FAQ categories" style={{ flexWrap: "wrap" }}>
      {cats.map((c) => {
        const n = counts ? counts[c] ?? 0 : null;
        return (
          <button key={c} type="button" aria-pressed={active === c} onClick={() => onSelect(c)}>
            {c === "all" ? "All" : CAT_LABEL[c]}
            {n !== null ? <span className="seg-count">{n}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
