import { storage, KEYS } from "./storage";
import { escapeHtml, notify } from "./notify";

export interface VisitLog {
  time: string;
  ip: string;
  isp: string;
  city: string;
  region: string;
  country: string;
  device: string;
  browser: string;
  os: string;
  screen: string;
  lang: string;
  tz: string;
}

const MAX_LOCAL_LOGS = 100;

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (/Kiwi/.test(ua)) browser = "Kiwi Browser";
  else if (/Edg/.test(ua)) browser = "Edge";
  else if (/OPR/.test(ua)) browser = "Opera";
  else if (/Firefox/.test(ua)) browser = "Firefox";
  else if (/Chrome/.test(ua)) browser = "Chrome";
  else if (/Safari/.test(ua)) browser = "Safari";

  let os = "Unknown";
  if (/Android/.test(ua)) os = "Android 📱";
  else if (/iPhone|iPad/.test(ua)) os = "iOS 🍎";
  else if (/Windows/.test(ua)) os = "Windows 💻";
  else if (/Mac/.test(ua)) os = "macOS 🍏";
  else if (/Linux/.test(ua)) os = "Linux 🐧";

  return {
    browser,
    os,
    device: /Mobi|Android/i.test(ua) ? "Mobile 📱" : "Desktop 🖥️",
    screen: `${window.screen.width}x${window.screen.height}`,
    lang: navigator.language || "?",
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "?"
  };
}

const clean = (v: unknown) => (v && String(v).trim() ? String(v).trim() : "?");

export async function getIPInfo() {
  const fallback = { ip: "Unavailable", isp: "Unavailable", city: "Unavailable", region: "Unavailable", country: "Unavailable" };
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3500);

  try {
    const requests = [
      fetch("https://ipwho.is/", { cache: "no-store", signal: controller.signal }).then(async (r) => {
        if (!r.ok) throw new Error("ipwho");
        const d = await r.json();
        if (!d || !d.ip) throw new Error("no ip");
        return {
          ip: clean(d.ip),
          isp: clean(d.connection?.isp || d.connection?.org || d.connection?.domain),
          city: clean(d.city),
          region: clean(d.region),
          country: clean(d.country)
        };
      }),
      fetch("https://ipapi.co/json/", { cache: "no-store", signal: controller.signal }).then(async (r) => {
        if (!r.ok) throw new Error("ipapi");
        const d = await r.json();
        if (!d || !d.ip) throw new Error("no ip");
        return {
          ip: clean(d.ip),
          isp: clean(d.org || d.asn),
          city: clean(d.city),
          region: clean(d.region),
          country: clean(d.country_name || d.country)
        };
      })
    ];

    const result = await Promise.any(requests);
    window.clearTimeout(timer);
    if (result.isp === "?") {
      try {
        const other = await Promise.any(
          requests.map((p) =>
            p.then((x) => {
              if (x.isp === "?") throw new Error("no isp");
              return x;
            })
          )
        );
        return other;
      } catch {
        /* keep first result */
      }
    }
    return result;
  } catch {
    window.clearTimeout(timer);
    try {
      const r = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
      const d = await r.json();
      return { ...fallback, ip: clean(d.ip) };
    } catch {
      return fallback;
    }
  }
}

export function readVisits(): VisitLog[] {
  const list = storage.getJSON<VisitLog[]>(KEYS.visits);
  return Array.isArray(list) ? list : [];
}

export function saveVisit(log: VisitLog): void {
  const next = [log, ...readVisits()].slice(0, MAX_LOCAL_LOGS);
  storage.setJSON(KEYS.visits, next);
}

export function clearVisits(): void {
  storage.remove(KEYS.visits);
}

export function exportVisits(): void {
  const blob = new Blob([JSON.stringify(readVisits(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `timepass-visitor-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function trackVisit(): Promise<void> {
  try {
    const d = getDeviceInfo();
    const ip = await getIPInfo();
    const now = new Date();
    saveVisit({
      time: now.toISOString(),
      ip: ip.ip,
      isp: ip.isp,
      city: ip.city,
      region: ip.region,
      country: ip.country,
      device: d.device,
      browser: d.browser,
      os: d.os,
      screen: d.screen,
      lang: d.lang,
      tz: d.tz
    });

    const time = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" });
    const msg = [
      "⚡ <b>TIMEPASS PREMIUM · NEW VISITOR</b>",
      "━━━━━━━━━━━━━━━━━━━━",
      "📍 <b>LOCATION & NETWORK</b>",
      `├ <b>IP:</b> <code>${escapeHtml(ip.ip)}</code>`,
      `├ <b>ISP:</b> <code>${escapeHtml(ip.isp)}</code>`,
      `└ <b>Location:</b> ${escapeHtml([ip.city, ip.region, ip.country].filter(Boolean).join(", "))}`,
      "",
      "📱 <b>DEVICE DETAILS</b>",
      `├ <b>Device:</b> ${escapeHtml(d.device)}`,
      `├ <b>OS:</b> ${escapeHtml(d.os)}`,
      `├ <b>Browser:</b> ${escapeHtml(d.browser)}`,
      `├ <b>Screen:</b> ${escapeHtml(d.screen)}`,
      `├ <b>Timezone:</b> ${escapeHtml(d.tz)}`,
      `└ <b>Language:</b> ${escapeHtml(d.lang)}`,
      "",
      `🇮🇳 <b>IST:</b> ${escapeHtml(time)}`,
      "━━━━━━━━━━━━━━━━━━━━"
    ].join("\n");
    void notify(msg);
  } catch {
    /* tracking must never break the site */
  }
}
