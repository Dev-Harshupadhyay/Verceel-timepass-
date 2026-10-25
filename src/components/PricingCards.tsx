import { useConfig } from "@/state/ConfigProvider";
import { activePlans, lowestPrice, visiblePacks } from "@/lib/payments";
import type { PackKey } from "@/types";

export function PricingCards({ onBuy }: { onBuy: (pack: PackKey) => void }) {
  const { config } = useConfig();
  const keys = visiblePacks(config);

  if (!keys.length) {
    return (
      <div className="admin-empty" style={{ padding: "32px 12px" }}>
        <i className="fa-solid fa-box-open" aria-hidden="true" />
        <b>Abhi koi pack live nahi hai</b>
        <small>Studio se pack active karo ya thodi der baad check karo.</small>
      </div>
    );
  }

  return (
    <div className="cards">
      {keys.map((key) => {
        const pack = config.packs[key];
        const plans = activePlans(pack);
        return (
          <div className={`card pack-${key}${pack.crown ? " card-crown" : ""}`} key={key}>
            <span className="p-watermark" aria-hidden="true">
              {pack.emoji}
            </span>
            {pack.crown ? <div className="crown">★ CROWN PICK</div> : null}
            <div className="p-head">
              <div className="p-emoji" aria-hidden="true">
                <span className="p-emoji-glyph">{pack.emoji}</span>
                <span className="p-emoji-spark">✨</span>
              </div>
              <div className="p-meta">
                <div className="p-title">{pack.title}</div>
                <div className="p-sub">{pack.sub}</div>
              </div>
              <span className="p-from">
                FROM <b>{plans.length ? `₹${lowestPrice(pack)}` : "—"}</b>
              </span>
            </div>

            <div className="rows">
              {plans.map((plan) => (
                <div className="price-row" key={plan.id}>
                  <span className="pr-name">
                    {plan.sticker ? (
                      <em className="pr-sticker" aria-hidden="true">
                        {plan.sticker}
                      </em>
                    ) : null}
                    {plan.name} {pack.suffix}
                    {plan.soldOut ? " · SOLD OUT" : ""}
                  </span>
                  <span style={plan.soldOut ? { textDecoration: "line-through", opacity: 0.55 } : undefined}>
                    ₹{plan.price}
                  </span>
                </div>
              ))}
              {!plans.length ? <div className="price-row"><span>Plans coming soon</span><span>—</span></div> : null}
            </div>

            <div
              className="beam"
              role="button"
              tabIndex={0}
              aria-label={pack.cta}
              onClick={() => onBuy(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onBuy(key);
                }
              }}
            >
              <span>
                <i className="fa-solid fa-play" aria-hidden="true" /> {pack.cta}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
