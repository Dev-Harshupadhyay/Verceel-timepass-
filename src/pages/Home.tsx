import { useConfig } from "@/state/ConfigProvider";
import { useLang } from "@/state/LangProvider";
import { Hero, TrustStrip } from "@/components/Hero";
import { PricingCards } from "@/components/PricingCards";
import { FaqAccordion, useFaqItems } from "@/components/Faq";
import { PriceCompare } from "@/components/PriceCompare";
import { Footer } from "@/components/Modals";
import { navigate } from "@/lib/router";
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
          <section className="faq-teaser">
            <div className="section-label">
              {config.hero.faqLabel} <small>{config.hero.faqSub}</small>
            </div>
            <p className="st-note" style={{ margin: "-4px 0 14px" }}>
              {t(config.info.title)}
            </p>
            <FaqAccordion items={faq} limit={4} />
            <div className="faq-teaser-head" style={{ marginTop: 14 }}>
              <span className="st-caption">{config.content.faqTeaserTitle}</span>
              <button type="button" className="faq-viewall" onClick={() => navigate("/faq")}>
                {config.content.faqViewAll} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        <Footer onInfo={() => navigate("/info")} onFaq={() => navigate("/faq")} />
      </div>
    </>
  );
}
