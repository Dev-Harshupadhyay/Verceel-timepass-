import { useConfig } from "@/state/ConfigProvider";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";

export interface HeaderProps {
  mode: "home" | "buy" | "info" | "faq";
  onInfo: () => void;
  onTheme: () => void;
  onAdmin: () => void;
  onMenu: () => void;
}

export function Header({ mode, onInfo, onTheme, onAdmin, onMenu }: HeaderProps) {
  const { config } = useConfig();
  const words = config.brand.name.trim().split(/\s+/);
  const lastWord = words.length > 1 ? words[words.length - 1] : "";
  const firstWord = (words.length > 1 ? words.slice(0, -1).join(" ") : config.brand.name).toUpperCase();

  return (
    <header>
      <div className="logo">
        <span className="crest logo-crest">
          <BrandLogo size={32} />
        </span>
        <span className="brand-lockup">
          <span className="brand-wordmark">{firstWord} <em>{lastWord}</em></span>
        </span>
      </div>

      <div className="hbtns">
        <button id="headerBtn" className="pill" onClick={onInfo} type="button">
          {mode !== "home" ? config.content.infoBack : config.content.infoButton}
        </button>
        <ThemeToggle />
        <button className="icon-btn" onClick={onTheme} aria-label="More themes" title="More themes" type="button">
          <i className="fa-solid fa-palette" aria-hidden="true" />
        </button>
        <button className="icon-btn" onClick={onAdmin} aria-label="Admin studio" title="Live Studio" type="button">
          <i className="fa-solid fa-shield-halved" aria-hidden="true" />
        </button>
        <button className="icon-btn" onClick={onMenu} aria-label="Menu" title="Menu" type="button">
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
