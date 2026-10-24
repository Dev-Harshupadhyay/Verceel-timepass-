import { useConfig } from "@/state/ConfigProvider";
import { useLang, LangSwitch } from "@/state/LangProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { FaqAccordion, useFaqItems } from "@/components/Faq";
import { navigate } from "@/lib/router";
import { activePlans, lowestPrice, visiblePacks } from "@/lib/payments";
import { telegramUrl } from "@/lib/payments";

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

export function InfoPage() {
  const { config } = useConfig();
  const { t } = useLang();
  const faq = useFaqItems();
  const packs = visiblePacks(config);

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
          <h1 className="page-title">{config.brand.name}</h1>
          <div className="page-sub">INFO · PRICING · POLICIES</div>
        </div>
      </div>

      <div className="info-toolbar">
        <span className="st-caption">{t({ en: "Language", hinglish: "Bhasha", hi: "भाषा" })}</span>
        <LangSwitch />
      </div>

      {/* intro */}
      <section className="info-intro">
        <h1>{t(config.info.title)}</h1>
        <p>{t(config.info.intro)}</p>
      </section>

      {/* value points — "OTT se kam price, affordable, kya milega" */}
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
            </article>
          ))}
        </div>
      </section>

      {/* what's inside each pack */}
      <section className="info-section">
        <h2 className="info-h2">{t(config.info.whatYouGet)}</h2>
        <div className="cmp-wrap">
          <table className="cmp-table">
            <thead>
              <tr>
                <th>PACK</th>
                <th>INCLUDES</th>
                <th>PLANS</th>
                <th>FROM</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((key) => {
                const pack = config.packs[key];
                const plans = activePlans(pack);
                return (
                  <tr key={key}>
                    <td style={{ color: "var(--ink)", fontWeight: 700 }}>
                      {pack.emoji} {pack.title}
                    </td>
                    <td>{pack.sub}</td>
                    <td style={{ fontFamily: "inherit" }}>
                      {plans.map((p) => `${p.name} ₹${p.price}`).join(" · ") || "—"}
                    </td>
                    <td>{plans.length ? `₹${lowestPrice(pack)}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="note-inline" style={{ marginTop: 10 }}>
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          <span>
            Payment methods: UPI <b>{config.links.upi}</b> · Razorpay universal link · QR scan. Screenshot verify hone ke baad
            access Telegram par milta hai.
          </span>
        </div>
      </section>

      {/* how it works */}
      <section className="info-section">
        <h2 className="info-h2">{t(config.info.howTitle)}</h2>
        <div className="steps">
          {config.info.howItWorks.map((step, i) => (
            <div className="step" key={i}>
              <span className="s-num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <b>{t(step.title)}</b>
                <p>{t(step.desc)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* policies */}
      <section className="info-section">
        <h2 className="info-h2">{t(config.info.policyTitle)}</h2>
        {config.info.policies.map((p, i) => (
          <div className="policy" key={i}>
            <b>{t(p.title)}</b>
            <p>{t(p.desc)}</p>
          </div>
        ))}
      </section>

      {/* faq */}
      <section className="info-section">
        <h2 className="info-h2">{config.content.faqTeaserTitle}</h2>
        <FaqAccordion items={faq} limit={6} />
        <div style={{ marginTop: 12 }}>
          <button type="button" className="faq-viewall" onClick={() => navigate("/faq")}>
            {config.content.faqViewAll} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </section>

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

      <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="st-btn primary" onClick={() => navigate("/")}>
          <i className="fa-solid fa-bag-shopping" aria-hidden="true" /> Choose a plan
        </button>
        <button type="button" className="st-btn" onClick={() => navigate("/faq")}>
          <i className="fa-solid fa-circle-question" aria-hidden="true" /> Full FAQ
        </button>
      </div>
    </div>
  );
}
