import { useEffect, useMemo, useState } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { storage, KEYS } from "@/lib/storage";
import type { Announcement as AnnouncementType } from "@/types";

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

  return (
    <div
      className={`announce tone-${ann.tone || "gold"} anim-${ann.animation || "shimmer"}`}
      role="region"
      aria-label="Announcement"
      data-testid="announcement"
    >
      <div className="announce-inner">
        {ann.badge ? <span className="announce-badge">{ann.badge}</span> : null}
        <span className="announce-text">{ann.text}</span>
        {countdown ? <span className="announce-countdown">⏳ {countdown}</span> : null}
        {ann.ctaLabel && ann.ctaUrl ? (
          <a className="announce-cta" href={ann.ctaUrl} target="_blank" rel="noopener noreferrer">
            {ann.ctaLabel}
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
