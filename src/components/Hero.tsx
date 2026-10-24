import { useConfig } from "@/state/ConfigProvider";

export function Hero({ onTrack }: { onTrack: () => void }) {
  const { config } = useConfig();
  const { hero, brand } = config;
  const image = hero.image || "/logo.svg";

  return (
    <div className="hero">
      <div className="ring">
        <img
          src={image}
          className="hero-img"
          alt={brand.name}
          width={142}
          height={142}
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.fallback) {
              img.dataset.fallback = "1";
              img.src = "/logo.svg";
            }
          }}
        />
      </div>
      <h1 className="main-title">{hero.title}</h1>
      <p className="tagline">{hero.tagline}</p>
      <div className="live-pill">
        <i className="fa-solid fa-circle" aria-hidden="true" /> {hero.badge}
      </div>
      <br />
      {hero.ctaLabel ? (
        <button type="button" className="welcome-harsh" onClick={onTrack}>
          {hero.ctaLabel}
        </button>
      ) : null}
    </div>
  );
}

const ICONS: Record<string, string> = {
  bolt: "fa-bolt",
  lock: "fa-lock",
  headset: "fa-headset",
  star: "fa-star",
  shield: "fa-shield-halved",
  gift: "fa-gift"
};

export function TrustStrip() {
  const { config } = useConfig();
  return (
    <div className="trust">
      {config.hero.trust.map((item, i) => (
        <div className="trust-item" key={`${item.title}-${i}`}>
          <i className={`fa-solid ${ICONS[item.icon] || "fa-star"}`} aria-hidden="true" />
          <b>{item.title}</b>
          <small>{item.sub}</small>
        </div>
      ))}
    </div>
  );
}
