import { useEffect } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { useTheme } from "@/state/ThemeProvider";
import { useLang } from "@/state/LangProvider";
import { THEMES, themeMeta } from "@/config";
import { telegramUrl } from "@/lib/payments";
import { BrandLogo } from "./BrandLogo";

export function Drawer({ open, onClose, onThemeOpen }: { open: boolean; onClose: () => void; onThemeOpen: () => void }) {
  const { config } = useConfig();
  const { brand, links, content, info } = config;
  const { theme, setTheme } = useTheme();
  const { t } = useLang();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`drawer-back${open ? " open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside
        id="devDrawer"
        className={`drawer${open ? " open" : ""}`}
        aria-label={`Made by ${brand.devName}`}
        aria-hidden={!open}
        role="dialog"
      >
        <div className="drawer-top">
          <h3>
            <BrandLogo size={20} className="drawer-logo" />
            <span className="drawer-title-txt">
              MADE BY <em>{brand.devName.toUpperCase()}</em>
            </span>
            <i className="fa-solid fa-crown drawer-crown" aria-hidden="true" />
          </h3>
          <button className="x-btn" style={{ position: "static" }} onClick={onClose} aria-label="Close menu" type="button">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="drawer-scroll">
          {/* ░░ PROFILE · CROWN CARD ░░ */}
          <section className="dev-hero">
            <div className="dev-hero-glow" aria-hidden="true" />

            {brand.devCrown ? (
              <div className="dev-crown">
                <i className="fa-solid fa-crown" aria-hidden="true" />
                <span>{brand.devCrown.replace(/^👑\s*/, "")}</span>
              </div>
            ) : null}

            <div className="dev-id">
              <div className="dev-avatar-wrap">
                <span className="dev-avatar-ring" aria-hidden="true" />
                <div className="dev-avatar">{brand.devName.slice(0, 1).toUpperCase()}</div>
                <span className="dev-dot" title="Available for work" />
              </div>
              <div className="dev-who">
                <b className="dev-name">
                  {brand.devName} <span className="dev-spark">⚡</span>
                </b>
                <span className="dev-handle">@{brand.devHandle}</span>
                {brand.devRole ? <span className="dev-role">{brand.devRole}</span> : null}
              </div>
            </div>

            {brand.devQuote ? <p className="dev-quote">“{brand.devQuote}”</p> : null}

            <p className="dev-bio">{brand.devBio}</p>

            <div className="dev-stats">
              {brand.devStats.map((s2, i) => (
                <div className="ds" key={`${s2.label}-${i}`}>
                  <b>{s2.value}</b>
                  <small>{s2.label}</small>
                </div>
              ))}
            </div>

            <div className="dev-tags">
              {brand.devTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <a className="dev-cta" href={telegramUrl(links.telegram)} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-telegram" aria-hidden="true" />
              <span>HIRE / CONTACT {brand.devName.toUpperCase()}</span>
              <i className="fa-solid fa-arrow-right dev-cta-arrow" aria-hidden="true" />
            </a>

            {brand.devUrl ? (
              <a className="dev-portfolio" href={brand.devUrl} target="_blank" rel="noopener noreferrer">
                <i className="fa-solid fa-globe" aria-hidden="true" />
                {brand.devPortfolioLabel || "PORTFOLIO"}
                <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
              </a>
            ) : null}
          </section>

          {/* ░░ APPEARANCE ░░ */}
          <div className="drawer-section-title">
            <i className="fa-solid fa-palette" aria-hidden="true" /> APPEARANCE · PICK A THEME
          </div>
          <div className="theme-grid" style={{ marginBottom: 6 }}>
            {THEMES.slice(0, 2).map((tm) => (
              <button
                key={tm.id}
                type="button"
                className={`theme-chip${theme === tm.id ? " active" : ""}`}
                onClick={() => setTheme(tm.id)}
                aria-pressed={theme === tm.id}
              >
                <span className="swatch" style={{ background: tm.sw }} />
                <span>{tm.name.toUpperCase()}</span>
              </button>
            ))}
            <button type="button" className="theme-chip" onClick={onThemeOpen}>
              <span className="swatch" style={{ background: "linear-gradient(135deg,#8b5cf6 45%,#22d3ee)" }} />
              <span>MORE THEMES</span>
            </button>
          </div>

          {/* ░░ CONTACT ░░ */}
          <div className="drawer-section-title">
            <i className="fa-solid fa-link" aria-hidden="true" /> CONTACT &amp; LINKS
          </div>
          <a className="drawer-link" href={telegramUrl(links.telegram)} target="_blank" rel="noopener noreferrer">
            <span className="dl-ico"><i className="fa-brands fa-telegram" aria-hidden="true" /></span>
            <span className="dl-txt">
              <b>CONTACT {brand.devName.toUpperCase()}</b>
              <small>Telegram · @{links.telegram}</small>
            </span>
            <i className="fa-solid fa-chevron-right arr" aria-hidden="true" />
          </a>
          <a className="drawer-link" href={`mailto:${links.email}`}>
            <span className="dl-ico"><i className="fa-solid fa-envelope" aria-hidden="true" /></span>
            <span className="dl-txt">
              <b>EMAIL SUPPORT</b>
              <small>{links.email}</small>
            </span>
            <i className="fa-solid fa-chevron-right arr" aria-hidden="true" />
          </a>
          <a className="drawer-link" href={links.portfolio} target="_blank" rel="noopener noreferrer">
            <span className="dl-ico"><i className="fa-solid fa-globe" aria-hidden="true" /></span>
            <span className="dl-txt">
              <b>{brand.devName.toUpperCase()} WEBSITE</b>
              <small>Portfolio · Projects · Profile</small>
            </span>
            <i className="fa-solid fa-chevron-right arr" aria-hidden="true" />
          </a>

          {/* ░░ TIMEPASS ░░ */}
          <div className="drawer-section-title">
            <i className="fa-solid fa-bolt" aria-hidden="true" /> {brand.shortName}
          </div>
          <a className="drawer-link" href={telegramUrl(links.bot)} target="_blank" rel="noopener noreferrer">
            <span className="dl-ico"><i className="fa-solid fa-robot" aria-hidden="true" /></span>
            <span className="dl-txt">
              <b>PURCHASE TRACKER BOT</b>
              <small>@{links.bot} · Purchase tracking</small>
            </span>
            <i className="fa-solid fa-chevron-right arr" aria-hidden="true" />
          </a>
          <a className="drawer-link" href={telegramUrl(links.channel)} target="_blank" rel="noopener noreferrer">
            <span className="dl-ico"><i className="fa-brands fa-telegram" aria-hidden="true" /></span>
            <span className="dl-txt">
              <b>OFFICIAL TELEGRAM CHANNEL</b>
              <small>Updates &amp; announcements</small>
            </span>
            <i className="fa-solid fa-chevron-right arr" aria-hidden="true" />
          </a>

          {/* ░░ GUIDE ░░ */}
          <div className="drawer-section-title">
            <i className="fa-solid fa-list-check" aria-hidden="true" /> {content.devGuideTitle}
          </div>
          <div className="guide">
            {info.howItWorks.map((step, i) => (
              <div className="guide-step" key={i}>
                <span className="gnum">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <b>{t(step.title)}</b>
                  <p>{t(step.desc)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="drawer-footer">
            {content.footerLine}
            <br />
            {content.footerBy} {brand.devName.toUpperCase()}
          </div>
        </div>
      </aside>
    </>
  );
}

/** exported for theme modal reuse */
export function themeSwatch(id: string): string {
  return themeMeta(id).sw;
}
