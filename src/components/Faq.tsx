import { useEffect, useMemo, useState } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { useLang } from "@/state/LangProvider";
import type { FaqCat, FaqItem } from "@/types";

export const CAT_META: Record<FaqCat, { label: string; emoji: string; icon: string }> = {
  pricing: { label: "Pricing", emoji: "💸", icon: "fa-tags" },
  payment: { label: "Payment", emoji: "💳", icon: "fa-credit-card" },
  access: { label: "Access", emoji: "🔑", icon: "fa-key" },
  support: { label: "Support", emoji: "🎧", icon: "fa-headset" },
  policy: { label: "Policy", emoji: "🛡️", icon: "fa-shield-halved" }
};

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

/** Wraps the search match in <mark> — text nodes only, never innerHTML. */
function Highlight({ text, query }: { text: string; query?: string }) {
  const q = (query || "").trim();
  if (!q) return <>{text}</>;
  const needle = q.toLowerCase();
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let at = 0;
  let key = 0;
  while (at < text.length) {
    const found = lower.indexOf(needle, at);
    if (found === -1) {
      parts.push(text.slice(at));
      break;
    }
    if (found > at) parts.push(text.slice(at, found));
    parts.push(
      <mark className="fq-hl" key={key++}>
        {text.slice(found, found + needle.length)}
      </mark>
    );
    at = found + needle.length;
  }
  return <>{parts}</>;
}

const ALL = "__all__";

export function FaqAccordion({
  items,
  showCat = false,
  limit,
  expandAll = false,
  query,
  focusId
}: {
  items: FaqItem[];
  showCat?: boolean;
  limit?: number;
  expandAll?: boolean;
  /** search text — matches get highlighted */
  query?: string;
  /** open this item and scroll to it (used by the "popular" chips) */
  focusId?: string | null;
}) {
  const { t } = useLang();
  const [openId, setOpenId] = useState<string | null>(expandAll ? ALL : null);
  const visible = typeof limit === "number" ? items.slice(0, limit) : items;

  useEffect(() => {
    setOpenId(expandAll ? ALL : null);
  }, [expandAll]);

  useEffect(() => {
    if (!focusId) return;
    if (!items.some((i) => i.id === focusId)) return;
    setOpenId(focusId);
    const el = typeof document !== "undefined" ? document.getElementById(`faq-btn-${focusId}`) : null;
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center" } as ScrollIntoViewOptions);
    }
  }, [focusId, items]);

  if (!visible.length) {
    return <p className="st-note">FAQ jaldi aa raha hai.</p>;
  }

  return (
    <div className="faq-list">
      {visible.map((item, i) => {
        const open = openId === ALL || openId === item.id;
        const meta = CAT_META[item.cat] || CAT_META.support;
        return (
          <div className="faq-item" data-open={open} data-cat={item.cat} key={item.id}>
            <button
              type="button"
              className="faq-q"
              aria-expanded={open}
              aria-controls={`faq-panel-${item.id}`}
              id={`faq-btn-${item.id}`}
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <span className="fq-ico" aria-hidden="true">
                {meta.emoji}
              </span>
              <span className="fq-text">
                <Highlight text={t(item.q) || `Question ${i + 1}`} query={query} />
              </span>
              {showCat ? <span className="faq-cat">{CAT_LABEL[item.cat]}</span> : null}
              <span className="fq-mark" aria-hidden="true">
                <i className="fa-solid fa-chevron-down" />
              </span>
            </button>
            <div
              className="faq-a"
              id={`faq-panel-${item.id}`}
              role="region"
              aria-labelledby={`faq-btn-${item.id}`}
              aria-hidden={!open}
            >
              <div>
                <p>
                  <Highlight text={t(item.a)} query={query} />
                </p>
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
    <label className="fq-search" style={{ position: "relative", display: "block", flex: "1 1 200px" }}>
      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        Search FAQ
      </span>
      <i
        className="fa-solid fa-magnifying-glass"
        aria-hidden="true"
        style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, opacity: 0.65 }}
      />
      <input
        className="st-input"
        style={{ paddingLeft: 36, paddingRight: value ? 38 : 12, minHeight: 44 }}
        type="search"
        placeholder="Search question… (UPI, refund, price)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="fq-clear"
          onClick={() => onChange("")}
          aria-label="Clear search"
          style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)" }}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      ) : null}
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
        const meta = c === "all" ? null : CAT_META[c];
        return (
          <button key={c} type="button" aria-pressed={active === c} onClick={() => onSelect(c)}>
            {meta ? <span aria-hidden="true" style={{ marginRight: 4 }}>{meta.emoji}</span> : null}
            {c === "all" ? "All" : CAT_LABEL[c]}
            {n !== null ? <span className="seg-count">{n}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
