import { useMemo } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { useLang } from "@/state/LangProvider";
import { activePlans } from "@/lib/payments";
import type { Lang, PackKey } from "@/types";

/**
 * OTT vs Timepass Premium — a plain-language price comparison.
 *
 * OTT figures are *typical Indian list prices*, used only as a reference point.
 * Timepass numbers always come from the live config, so a price change in the
 * Studio updates this table instantly.
 */

interface OttRef {
  name: string;
  plan: string;
  price: number; // ₹ per month
  color: string;
}

const OTT_REFS: OttRef[] = [
  { name: "Netflix", plan: "Standard", price: 499, color: "#e50914" },
  { name: "JioHotstar", plan: "Premium", price: 499, color: "#1a73e8" },
  { name: "Amazon Prime", plan: "Prime", price: 299, color: "#00a8e1" },
  { name: "Zee5", plan: "Premium", price: 299, color: "#8230c6" },
  { name: "SonyLIV", plan: "Premium", price: 299, color: "#f26522" },
  { name: "Apple TV+", plan: "Standard", price: 99, color: "#8b8b8b" }
];

type Copy = {
  kicker: string;
  title: string;
  sub: string;
  ourCol: string;
  ottCol: string;
  perMonth: string;
  perYear: string;
  entry: string;
  entryLabel: string;
  yearLabel: string;
  yearPer: string;
  cheapest: string;
  saveLine: (save: number, pct: number) => string;
  bullets: [string, string, string];
  cta: string;
  footnote: string;
  youAreHere: string;
  onetime: string;
};

const COPY: Record<Lang, Copy> = {
  hinglish: {
    kicker: "OTT vs TIMEPASS PREMIUM",
    title: "Ek OTT ka 1 mahina = hamara poora saal",
    sub: "Sirf price nahi — poora saal ka access, ek hi baar payment, koi auto-renew nahi.",
    ourCol: "TIMEPASS PREMIUM",
    ottCol: "POPULAR OTT · APPROX ₹/MONTH",
    perMonth: "/month",
    perYear: "/year",
    entry: "shuru",
    entryLabel: "1 Month plan",
    yearLabel: "1 Year · sabse sasta",
    yearPer: "per month padta hai",
    cheapest: "cheapest popular OTT",
    saveLine: (save, pct) => `Sabse saste OTT se bhi ₹${save}/month kam — approx ${pct}% bachat.`,
    bullets: ["Ek baar pay, poora saal tension free", "Instant access · Telegram par verify", "Movies + Series + Combo, sab ek jagah"],
    cta: "PLANS DEKHO",
    footnote:
      "OTT prices approx Indian list prices hain (2025–26), platform aur plan ke hisaab se badalte rehte hain. Ye comparison sirf samajhne ke liye hai.",
    youAreHere: "YAHAN HO TUM",
    onetime: "One-time payment"
  },
  en: {
    kicker: "OTT vs TIMEPASS PREMIUM",
    title: "One OTT month = our whole year",
    sub: "Not just cheaper — a full year of access, one payment, no auto-renew.",
    ourCol: "TIMEPASS PREMIUM",
    ottCol: "POPULAR OTT · APPROX ₹/MONTH",
    perMonth: "/month",
    perYear: "/year",
    entry: "starts at",
    entryLabel: "1 Month plan",
    yearLabel: "1 Year · best value",
    yearPer: "works out per month",
    cheapest: "cheapest popular OTT",
    saveLine: (save, pct) => `₹${save}/month cheaper than the cheapest OTT — about ${pct}% saved.`,
    bullets: ["Pay once, relax for the whole year", "Instant access · verified on Telegram", "Movies + Series + Combo in one place"],
    cta: "SEE PLANS",
    footnote:
      "OTT prices are approximate Indian list prices (2025–26) and change with platform and plan. Comparison is for reference only.",
    youAreHere: "YOU ARE HERE",
    onetime: "One-time payment"
  },
  hi: {
    kicker: "OTT vs TIMEPASS PREMIUM",
    title: "एक OTT का 1 महीना = हमारा पूरा साल",
    sub: "सिर्फ़ सस्ता नहीं — पूरे साल का एक्सेस, एक ही बार भुगतान, कोई ऑटो-रिन्यू नहीं।",
    ourCol: "TIMEPASS PREMIUM",
    ottCol: "लोकप्रिय OTT · लगभग ₹/महीना",
    perMonth: "/महीना",
    perYear: "/साल",
    entry: "से शुरू",
    entryLabel: "1 महीने का प्लान",
    yearLabel: "1 साल · सबसे बेहतर",
    yearPer: "प्रति महीना पड़ता है",
    cheapest: "सबसे सस्ता लोकप्रिय OTT",
    saveLine: (save, pct) => `सबसे सस्ते OTT से भी ₹${save}/महीना कम — लगभग ${pct}% बचत।`,
    bullets: ["एक बार भुगतान, पूरे साल की टेंशन ख़त्म", "तुरंत एक्सेस · Telegram पर वेरिफ़ाई", "Movies + Series + Combo, सब एक जगह"],
    cta: "प्लान देखें",
    footnote:
      "OTT कीमतें लगभग भारतीय लिस्ट प्राइस (2025–26) हैं और प्लेटफ़ॉर्म/प्लान के हिसाब से बदलती रहती हैं। तुलना सिर्फ़ समझने के लिए है।",
    youAreHere: "यहाँ हो तुम",
    onetime: "एक बार का भुगतान"
  }
};

function monthsOf(name: string): number {
  const n = parseInt(name, 10) || 1;
  if (/year/i.test(name)) return n * 12;
  if (/month/i.test(name)) return n;
  return n;
}

export function PriceCompare({ onBuy }: { onBuy: (pack: PackKey) => void }) {
  const { config } = useConfig();
  const { lang } = useLang();
  const c = COPY[lang] || COPY.hinglish;

  const live = useMemo(() => {
    const plans = activePlans(config.packs.movies);
    const priced = plans.filter((p) => p.price > 0);
    if (!priced.length) return null;

    const entry = priced.reduce((a, b) => (a.price <= b.price ? a : b));
    /* best ₹/month plan = lowest price per month */
    const best = [...priced].sort((a, b) => a.price / monthsOf(a.name) - b.price / monthsOf(b.name))[0];
    const bestPerMonth = Math.max(1, Math.round(best.price / monthsOf(best.name)));

    const cheapestOtt = Math.min(...OTT_REFS.map((o) => o.price));
    const save = Math.max(0, cheapestOtt - bestPerMonth);
    const pct = cheapestOtt > 0 ? Math.round((save / cheapestOtt) * 100) : 0;

    return { entry, best, bestPerMonth, cheapestOtt, save, pct };
  }, [config.packs.movies]);

  if (!live) return null;

  const maxPrice = Math.max(...OTT_REFS.map((o) => o.price), live.bestPerMonth);
  const rows = [...OTT_REFS].sort((a, b) => b.price - a.price);

  return (
    <section className="cmp" aria-labelledby="cmp-title">
      <div className="cmp-head">
        <span className="cmp-kicker">
          <i className="fa-solid fa-scale-balanced" aria-hidden="true" /> {c.kicker}
        </span>
        <h2 className="cmp-title" id="cmp-title">
          {c.title}
        </h2>
        <p className="cmp-sub">{c.sub}</p>
      </div>

      <div className="cmp-hero">
        <div className="cmp-stat">
          <b>
            ₹{live.entry.price}
            <small>{c.perMonth}</small>
          </b>
          <span>{c.entryLabel}</span>
        </div>
        <div className="cmp-vs" aria-hidden="true">
          VS
        </div>
        <div className="cmp-stat is-ours">
          <b>
            ₹{live.bestPerMonth}
            <small>{c.perMonth}</small>
          </b>
          <span>
            {c.yearLabel} · ₹{live.best.price}
            {c.perYear}
          </span>
        </div>
      </div>

      <div className="cmp-list">
        <div className="cmp-row is-ours">
          <div className="cmp-name">
            <span className="cmp-dot" style={{ background: "var(--gold)" }} aria-hidden="true" />
            <b>{c.ourCol}</b>
            <em>{c.youAreHere}</em>
          </div>
          <div className="cmp-bar">
            <span style={{ width: `${Math.min(100, (live.bestPerMonth / maxPrice) * 100)}%` }} />
          </div>
          <div className="cmp-price">
            <b>₹{live.bestPerMonth}</b>
            <small>{c.perMonth}</small>
          </div>
        </div>

        {rows.map((o) => (
          <div className="cmp-row" key={o.name}>
            <div className="cmp-name">
              <span className="cmp-dot" style={{ background: o.color }} aria-hidden="true" />
              <b>{o.name}</b>
              <em>{o.plan}</em>
            </div>
            <div className="cmp-bar">
              <span style={{ width: `${(o.price / maxPrice) * 100}%`, background: o.color, opacity: 0.55 }} />
            </div>
            <div className="cmp-price">
              <b>₹{o.price}</b>
              <small>{c.perMonth}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="cmp-save">
        <i className="fa-solid fa-arrow-trend-down" aria-hidden="true" />
        <span>{c.saveLine(live.save, live.pct)}</span>
      </div>

      <ul className="cmp-bullets">
        {c.bullets.map((b) => (
          <li key={b}>
            <i className="fa-solid fa-check" aria-hidden="true" /> {b}
          </li>
        ))}
      </ul>

      <div className="cmp-foot">
        <button type="button" className="cmp-cta" onClick={() => onBuy("movies")}>
          {c.cta} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
        <p className="cmp-note">
          <i className="fa-solid fa-circle-info" aria-hidden="true" /> {c.footnote}
        </p>
      </div>
    </section>
  );
}
