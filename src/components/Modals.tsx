import { useEffect, useMemo } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { useTheme } from "@/state/ThemeProvider";
import { useToast } from "@/state/ToastProvider";
import { THEMES } from "@/config";
import { qrSrc, telegramUrl } from "@/lib/payments";
import { BrandLogo } from "./BrandLogo";

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

export function ThemeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  useEsc(open, onClose);

  if (!open) return null;
  const primary = THEMES.slice(0, 2);
  const more = THEMES.slice(2);

  return (
    <div className="modal" style={{ display: "block" }} role="dialog" aria-modal="true" aria-label="Choose theme" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <button className="x-btn" onClick={onClose} aria-label="Close" type="button">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        <div className="eyebrow">🎨 APPEARANCE</div>
        <h2>Choose Your Theme</h2>
        <p style={{ fontSize: 10.5, color: "var(--muted)", lineHeight: 1.7, marginTop: 6 }}>
          Theme turant apply hoga aur next visit par yaad rahega.
        </p>

        <div className="st-caption" style={{ margin: "16px 0 8px", textAlign: "left" }}>Primary</div>
        <div className="theme-grid" style={{ marginBottom: 14 }}>
          {primary.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-chip${theme === t.id ? " active" : ""}`}
              aria-pressed={theme === t.id}
              onClick={() => {
                setTheme(t.id);
                toast(`🎨 ${t.name}`, "success");
              }}
            >
              <span className="swatch" style={{ background: t.sw }} />
              <span>{t.name.toUpperCase()}</span>
            </button>
          ))}
        </div>

        <div className="st-caption" style={{ margin: "0 0 8px", textAlign: "left" }}>More themes</div>
        <div className="theme-grid" style={{ marginBottom: 16 }}>
          {more.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-chip${theme === t.id ? " active" : ""}`}
              aria-pressed={theme === t.id}
              onClick={() => {
                setTheme(t.id);
                toast(`🎨 ${t.name}`, "success");
              }}
            >
              <span className="swatch" style={{ background: t.sw }} />
              <span>{t.name.toUpperCase()}</span>
            </button>
          ))}
        </div>

        <button className="soft-btn" onClick={onClose} type="button">
          DONE
        </button>
      </div>
    </div>
  );
}

export function TelegramModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { config } = useConfig();
  const { toast } = useToast();
  useEsc(open, onClose);

  const channel = telegramUrl(config.links.channel);
  const src = useMemo(() => qrSrc(channel, 360), [channel]);

  if (!open) return null;

  const downloadQR = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "Timepass_Telegram_QR.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      toast("QR download fail — long-press karke save karo", "error");
    }
  };

  return (
    <div className="modal" style={{ display: "block" }} role="dialog" aria-modal="true" aria-label="Telegram notice" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <button className="x-btn" onClick={onClose} aria-label="Close" type="button">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <BrandLogo size={34} />
        </div>
        <div className="eyebrow">{config.content.telegramEyebrow}</div>
        <h2>{config.content.telegramTitle}</h2>
        <a className="tg-btn-main" href={channel} target="_blank" rel="noopener noreferrer">
          <span>
            <b>OFFICIAL CHANNEL</b>
            <small>JOIN TELEGRAM CHANNEL</small>
          </span>
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </a>
        <div className="pay-heading">OFFICIAL QR CODE</div>
        <div className="qr-mini">
          <img src={src} alt="Telegram QR Code" loading="lazy" decoding="async" />
        </div>
        <p style={{ fontSize: 10.5, color: "var(--muted)", lineHeight: 1.7 }}>{config.content.telegramDesc}</p>
        <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
          <button className="soft-btn" onClick={downloadQR} type="button">
            <i className="fa-solid fa-download" aria-hidden="true" /> SAVE QR
          </button>
          <button className="soft-btn" onClick={onClose} type="button">
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}

export function Footer({ onInfo, onFaq }: { onInfo: () => void; onFaq: () => void }) {
  const { config } = useConfig();
  return (
    <footer>
      <div className="footer-brand">
        <BrandLogo size={18} /> {config.content.footerLine} · {config.content.footerBy}{" "}
        <a href={config.brand.devUrl} target="_blank" rel="noopener noreferrer">
          {config.brand.devName.toUpperCase()}
        </a>
      </div>
      <div style={{ marginTop: 4 }}>{config.content.footerCredit}</div>
      <div className="footer-links">
        <button type="button" onClick={onInfo} className="footer-link">
          Info
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={onFaq} className="footer-link">
          FAQ
        </button>
        <span aria-hidden="true">·</span>
        <a href={telegramUrl(config.links.telegram)} target="_blank" rel="noopener noreferrer">
          Support
        </a>
      </div>
    </footer>
  );
}
