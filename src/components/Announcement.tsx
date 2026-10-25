import { useEffect, useMemo, useState } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { storage, KEYS } from "@/lib/storage";
import type { Announcement as AnnouncementType } from "@/types";

/** site-relative links stay in this tab; only external ones open a new one */
const isInternal = (url: string) => url.startsWith("/");

function useCountdown(expiresAt: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  return useMemo(() => {
    if (!expiresAt) return null;
    const end = Date.parse(expiresAt);
    if (Number.isNaN(end)) return null;
    const diff = end - now;
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, [expiresAt, now]);
}

export function Announcement({
  value,
  preview = false,
  revisionOverride
}: {
  value?: AnnouncementType;
  preview?: boolean;
  revisionOverride?: number;
}) {
  const { config } = useConfig();
  const ann = value || config.announcement;
  const revision = revisionOverride ?? config.revision;

  const [hidden, setHidden] = useState(false);
  const countdown = useCountdown(ann.expiresAt);
  const dismissKey = `${revision}:${ann.text.slice(0, 40)}`;
  const [dismissed, setDismissed] = useState(() => !preview && storage.get(KEYS.announceDismiss) === dismissKey);

  useEffect(() => {
    setDismissed(!preview && storage.get(KEYS.announceDismiss) === dismissKey);
  }, [dismissKey, preview]);

  const expired = !preview && ann.expiresAt ? Date.parse(ann.expiresAt) <= Date.now() : false;

  if (!ann.enabled || !ann.text.trim() || hidden || dismissed || expired) return null;

  const close = () => {
    setHidden(true);
    if (!preview) storage.set(KEYS.announceDismiss, dismissKey);
  };

  const marquee = ann.animation === "marquee";

  return (
    <div
      className={`announce tone-${ann.tone || "gold"} anim-${ann.animation || "shimmer"}`}
      role="region"
      aria-label="Announcement"
      data-testid="announcement"
    >
      <span className="announce-glow" aria-hidden="true" />

      <div className="announce-inner">
        {ann.badge ? (
          <span className="announce-badge">
            <i className="announce-dot" aria-hidden="true" />
            {ann.badge}
          </span>
        ) : null}

        {marquee ? (
          <span className="announce-marquee">
            <span className="announce-track">
              <span>{ann.text}</span>
              <span className="announce-sep" aria-hidden="true">
                ✦
              </span>
              <span aria-hidden="true">{ann.text}</span>
              <span className="announce-sep" aria-hidden="true">
                ✦
              </span>
            </span>
          </span>
        ) : (
          <span className="announce-text">{ann.text}</span>
        )}

        {countdown ? (
          <span className="announce-countdown" title="Offer ends in">
            <i className="fa-regular fa-clock" aria-hidden="true" /> {countdown}
          </span>
        ) : null}

        {ann.ctaLabel && ann.ctaUrl ? (
          <a
            className="announce-cta"
            href={ann.ctaUrl}
            {...(isInternal(ann.ctaUrl) ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          >
            {ann.ctaLabel} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {ann.dismissible ? (
        <button type="button" className="announce-close" onClick={close} aria-label="Dismiss announcement">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
