import { useConfig } from "@/state/ConfigProvider";
import { useLang } from "@/state/LangProvider";
import { Hero, TrustStrip } from "@/components/Hero";
import { PricingCards } from "@/components/PricingCards";
import { FaqAccordion, useFaqItems } from "@/components/Faq";
import { PriceCompare } from "@/components/PriceCompare";
import { Footer } from "@/components/Modals";
import { navigate } from "@/lib/router";
import { telegramUrl } from "@/lib/payments";
import type { PackKey } from "@/types";

export function Home({ onTrack }: { onTrack: () => void }) {
  const { config } = useConfig();
  const { t } = useLang();
  const faq = useFaqItems();

  return (
    <>
      <Hero onTrack={onTrack} />
      <TrustStrip />

      <div className="wrap">
        <div className="section-label">
          {config.hero.sectionLabel} <small>{config.hero.sectionSub}</small>
        </div>
        <PricingCards onBuy={(pack: PackKey) => navigate(`/buy/${pack}`)} />

        <PriceCompare onBuy={(pack: PackKey) => navigate(`/buy/${pack}`)} />

        {(config.info?.intro || faq.length) && (
          <section className="faq-teaser faq-zone">
            <span className="fz-sticker fz-1" aria-hidden="true">💬</span>
            <span className="fz-sticker fz-2" aria-hidden="true">⚡</span>
            <div className="fz-head">
              <span className="fz-icon" aria-hidden="true">💬</span>
              <div className="fz-meta">
                <div className="section-label" style={{ margin: 0 }}>
                  {config.hero.faqLabel} <small>{config.hero.faqSub}</small>
                </div>
                <p className="st-note" style={{ margin: "4px 0 0" }}>
                  {t(config.info.title)}
                </p>
              </div>
            </div>
            <FaqAccordion items={faq} limit={4} />
            <div className="faq-teaser-head" style={{ marginTop: 14 }}>
              <span className="st-caption">{config.content.faqTeaserTitle}</span>
              <div className="fz-actions">
                <a
                  className="fz-tg"
                  href={telegramUrl(config.links.telegram)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fa-brands fa-telegram" aria-hidden="true" /> Poochh lo
                </a>
                <button type="button" className="faq-viewall" onClick={() => navigate("/faq")}>
                  {config.content.faqViewAll} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        )}

        <Footer onInfo={() => navigate("/info")} onFaq={() => navigate("/faq")} />
      </div>
    </>
  );
}
