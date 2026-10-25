/**
 * Device / pointer detection.
 *
 * Payment UX depends on this:
 *   • phone / touch device  → UPI deep link (`upi://pay?...` opens GPay/PhonePe/Paytm)
 *   • desktop (mouse)       → QR code + UPI ID, scan with the phone
 *
 * We look at the *pointer* first (a small touch tablet can still pay in an app),
 * then width only to label the device.
 */

import { useEffect, useState } from "react";

export type DeviceKind = "mobile" | "tablet" | "desktop";

export interface DeviceInfo {
  kind: DeviceKind;
  /** coarse pointer or touch support — an in-app UPI deep link will work */
  hasTouch: boolean;
  isDesktop: boolean;
  isMobile: boolean;
  os: "ios" | "android" | "other";
  /** true → show QR + UPI ID as the primary payment surface */
  payWithQr: boolean;
}

function mq(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

export function detectDevice(): DeviceInfo {
  if (typeof window === "undefined") {
    return { kind: "desktop", hasTouch: false, isDesktop: true, isMobile: false, os: "other", payWithQr: true };
  }

  const width = window.innerWidth || document.documentElement.clientWidth || 1024;
  const ua = navigator.userAgent || "";

  // `pointer: coarse` / `any-pointer: coarse` are the reliable signals;
  // maxTouchPoints covers hybrids where the primary pointer is still a mouse.
  const hasTouch =
    mq("(pointer: coarse)") || mq("(any-pointer: coarse)") || (navigator.maxTouchPoints || 0) > 0;

  const kind: DeviceKind = width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
  const os: DeviceInfo["os"] = /iphone|ipad|ipod/i.test(ua)
    ? "ios"
    : /android/i.test(ua)
      ? "android"
      : "other";

  return {
    kind,
    hasTouch,
    isDesktop: kind === "desktop",
    isMobile: kind === "mobile",
    os,
    // Desktop → QR flow. Any touch device → deep link flow.
    payWithQr: !hasTouch
  };
}

/** Re-renders on resize / pointer changes. */
export function useDevice(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(() => detectDevice());

  useEffect(() => {
    let raf = 0;
    const update = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => setInfo(detectDevice()));
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update);
    const list: MediaQueryList | null =
      typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)") : null;
    if (list) {
      if (typeof list.addEventListener === "function") list.addEventListener("change", update);
      else if (typeof list.addListener === "function") list.addListener(update);
    }
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (list) {
        if (typeof list.removeEventListener === "function") list.removeEventListener("change", update);
        else if (typeof list.removeListener === "function") list.removeListener(update);
      }
    };
  }, []);

  return info;
}
