import { useConfig } from "@/state/ConfigProvider";
import { useLang, LangSwitch } from "@/state/LangProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { FaqAccordion, useFaqItems } from "@/components/Faq";
import { navigate } from "@/lib/router";
import { activePlans, lowestPrice, visiblePacks, telegramUrl } from "@/lib/payments";
import type { PackKey } from "@/types";

const ICONS: Record<string, string> = {
  tag: "fa-tag",
  "layer-group": "fa-layer-group",
  clapperboard: "fa-clapperboard",
  bolt: "fa-bolt",
  "shield-halved": "fa-shield-halved",
  headset: "fa-headset",
  star: "fa-star",
  gift: "fa-gift",
  lock: "fa-lock",
  wallet: "fa-wallet"
};

const STEP_EMOJI = ["🛒", "💳", "📸", "🔑"];
const POLICY_ICON = ["fa-shield-halved", "fa-piggy-bank", "fa-comment-slash", "fa-arrows-rotate"];
const PACK_STICKER: Record<PackKey, string> = { movies: "🎬", adult: "🔞", combo: "🎁" };

const L = {
  kicker: { en: "ABOUT · PRICING · POLICIES", hinglish: "ABOUT · PRICING · POLICIES", hi: "परिचय · कीमत · नीतियाँ" },
  from: { en: "starts at", hinglish: "shuru", hi: "शुरू" },
  packs: { en: "packs", hinglish: "packs", hi: "पैक" },
  delivery: { en: "instant access", hinglish: "instant access", hi: "तुरंत एक्सेस" },
  buy: { en: "BUY", hinglish: "BUY", hi: "ख़रीदें" },
  choosePlan: { en: "Choose a plan", hinglish: "Plan choose karo", hi: "प्लान चुनें" },
  fullFaq: { en: "Full FAQ", hinglish: "Full FAQ", hi: "पूरा FAQ" }
};

export function InfoPage() {
  const { config } = useConfig();
  const { t, lang } = useLang();
  const faq = useFaqItems();
  const packs = visiblePacks(config);

  const packPrices = packs.map((k) => lowestPrice(config.packs[k])).filter((n) => n > 0);
  const cheapest = packPrices.length ? Math.min(...packPrices) : 0;

  return (
    <div className="page-shell info-shell">
      <button type="button" className="page-back" onClick={() => navigate("/")}>
        <i className="fa-solid fa-arrow-left" aria-hidden="true" /> HOME
      </button>

      {/* ───────── hero ───────── */}
      <header className="ix-hero">
        <span className="fx-glow" aria-hidden="true" />
        <span className="fx-sticker fx-s1" aria-hidden="true">🍿</span>
        <span className="fx-sticker fx-s3" aria-hidden="true">🎬</span>

        <span className="fx-kicker">
          <BrandLogo size={16} /> {config.brand.name.toUpperCase()}
        </span>
        <h1 className="fx-title">{t(config.info.title)}</h1>
        <p className="fx-sub">{t(config.info.intro)}</p>

        <div className="fx-stats">
          <div>
            <b>₹{Number.isFinite(cheapest) ? cheapest : 0}</b>
            <small>{L.from[lang]?.toUpperCase()}</small>
          </div>
          <div>
            <b>{packs.length}</b>
            <small>{L.packs[lang]?.toUpperCase()}</small>
          </div>
          <div>
            <b>⚡</b>
            <small>{L.delivery[lang]?.toUpperCase()}</small>
          </div>
        </div>

        <div className="info-toolbar" style={{ margin: "14px 0 0" }}>
          <span className="st-caption">{t({ en: "Language", hinglish: "Bhasha", hi: "भाषा" })}</span>
          <LangSwitch />
        </div>
      </header>

      {/* ───────── value points ───────── */}
      <section className="info-section">
        <h2 className="info-h2">{t(config.info.valueTitle)}</h2>
        <div className="info-grid">
          {config.info.points.map((point, i) => (
            <article className="info-card" key={i}>
              <span className="ic-ico">
                <i className={`fa-solid ${ICONS[point.icon] || "fa-star"}`} aria-hidden="true" />
              </span>
              <div>
                <b>{t(point.title)}</b>
                <p>{t(point.desc)}</p>
              </div>
              <span className="ic-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* ───────── packs ───────── */}
      <section className="info-section">
        <h2 className="info-h2">{t(config.info.whatYouGet)}</h2>
        <div className="pack-tiles">
          {packs.map((key) => {
            const pack = config.packs[key];
            const plans = activePlans(pack);
            return (
              <article className={`pack-tile${pack.crown ? " is-crown" : ""}`} key={key}>
                <span className="pt-watermark" aria-hidden="true">
                  {PACK_STICKER[key] || pack.emoji}
                </span>
                <div className="pt-head">
                  <span className="pt-emoji" aria-hidden="true">
                    {pack.emoji}
                  </span>
                  <div className="pt-meta">
                    <b>{pack.title}</b>
                    <small>{pack.sub}</small>
                  </div>
                  <span className="pt-from">
                    FROM <b>{plans.length ? `₹${lowestPrice(pack)}` : "—"}</b>
                  </span>
                </div>
                <ul className="pt-plans">
                  {plans.map((p) => (
                    <li key={p.id}>
                      <span className="pt-sticker" aria-hidden="true">{p.sticker || "•"}</span>
                      <span>{p.name}</span>
                      <b>₹{p.price}</b>
                    </li>
                  ))}
                  {!plans.length ? <li><span>Plans coming soon</span></li> : null}
                </ul>
                <button type="button" className="pt-cta" onClick={() => navigate(`/buy/${key}`)}>
                  {L.buy[lang] || "BUY"} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </div>
        <div className="note-inline" style={{ marginTop: 12 }}>
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          <span>
            Payment: UPI <b>{config.links.upi}</b> · QR scan · universal link. Screenshot verify hone ke baad access Telegram par
            milta hai.
          </span>
        </div>
      </section>

      {/* ───────── how it works ───────── */}
      <section className="info-section">
        <h2 className="info-h2">{t(config.info.howTitle)}</h2>
        <div className="steps">
          {config.info.howItWorks.map((step, i) => (
            <div className="step" key={i}>
              <span className="s-emoji" aria-hidden="true">
                {STEP_EMOJI[i] || "✅"}
              </span>
              <div>
                <span className="s-num">{String(i + 1).padStart(2, "0")}</span>
                <b>{t(step.title)}</b>
                <p>{t(step.desc)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── policies ───────── */}
      <section className="info-section">
        <h2 className="info-h2">{t(config.info.policyTitle)}</h2>
        <div className="policy-grid">
          {config.info.policies.map((p, i) => (
            <div className="policy" key={i}>
              <span className="pol-ico" aria-hidden="true">
                <i className={`fa-solid ${POLICY_ICON[i % POLICY_ICON.length]}`} />
              </span>
              <div>
                <b>{t(p.title)}</b>
                <p>{t(p.desc)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── faq teaser ───────── */}
      <section className="info-section">
        <h2 className="info-h2">{config.content.faqTeaserTitle}</h2>
        <FaqAccordion items={faq} limit={5} />
        <div style={{ marginTop: 12 }}>
          <button type="button" className="faq-viewall" onClick={() => navigate("/faq")}>
            {config.content.faqViewAll} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* ───────── support ───────── */}
      <div className="support-note">
        <i className="fa-brands fa-telegram" aria-hidden="true" />
        <span>
          {t(config.info.supportNote)}
          <br />
          <a href={telegramUrl(config.links.telegram)} target="_blank" rel="noopener noreferrer">
            @{config.links.telegram}
          </a>
          {" · "}
          <a href={`mailto:${config.links.email}`}>{config.links.email}</a>
        </span>
      </div>

      <div className="fx-foot-actions">
        <button type="button" className="st-btn primary" onClick={() => navigate("/")}>
          <i className="fa-solid fa-bag-shopping" aria-hidden="true" /> {L.choosePlan[lang] || "Choose a plan"}
        </button>
        <button type="button" className="st-btn" onClick={() => navigate("/faq")}>
          <i className="fa-solid fa-circle-question" aria-hidden="true" /> {L.fullFaq[lang] || "Full FAQ"}
        </button>
      </div>
    </div>
  );
}
