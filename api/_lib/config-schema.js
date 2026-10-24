/**
 * api/_lib/config-schema.js
 *
 * One validation / normalisation layer shared by:
 *   • /api/pricing.js  (server, authoritative)
 *   • tools/dev-server.mjs (local mock)
 *   • tests/*.test.mjs
 *
 * The browser keeps a small mirror of the *normalisation* rules (it never
 * trusts the server response blindly), but the server always re-validates.
 *
 * Security rules enforced here:
 *   • no HTML / script characters in any user supplied string  (< > stripped)
 *   • URLs must be http(s) or a site-relative path
 *   • Telegram handles, UPI ids, emails and Razorpay ids are format checked
 *   • every string has a hard length cap, every array a hard item cap
 *   • prices are clamped to 0 … 999999 integers
 */

import { DEFAULT_CONFIG } from "./defaults.js";

export const CONFIG_VERSION = 2;
export const CONFIG_KEY = "timepass:config";
export const HISTORY_KEY = "timepass:history";
export const MAX_REVISIONS = 20;
export const MAX_HISTORY_BYTES = 700 * 1024;
export const MAX_BODY_BYTES = 400 * 1024;
export const MAX_PLANS_PER_PACK = 6;
export const MAX_FAQ = 30;

export const PACK_KEYS = ["movies", "adult", "combo"];
export const LIGHT_THEMES = ["apple-light", "pearl"];
export const DARK_THEMES = ["obsidian", "violet-dark", "amethyst", "cyber", "crimson", "emerald"];
export const THEME_IDS = [...LIGHT_THEMES, ...DARK_THEMES];
export const LANGS = ["en", "hinglish", "hi"];
export const FAQ_CATS = ["pricing", "payment", "access", "support", "policy"];
export const PAY_MODES = ["auto", "razorpay", "upi", "universal"];
export const ANNOUNCE_TONES = ["gold", "violet", "red"];
export const ANNOUNCE_ANIMS = ["shimmer", "marquee", "none"];
export const TRUST_ICONS = ["bolt", "lock", "headset", "star", "shield", "gift"];

/* ────────────────────────────── small utils ────────────────────────────── */

export function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function deepClone(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

export function deepMerge(base, patch) {
  if (!isPlainObject(patch)) return deepClone(base);
  const out = isPlainObject(base) ? { ...base } : {};
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : deepClone(v);
  }
  return out;
}

export function slug(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
}

/** single line text: strips HTML, control chars, collapses whitespace, caps length */
export function cleanText(v, max, fallback = "") {
  if (typeof v !== "string") return fallback;
  const stripped = v
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return [...stripped].slice(0, max).join("").trim() || fallback;
}

/** multi-line text (keeps \n) */
export function cleanMultiline(v, max, fallback = "") {
  if (typeof v !== "string") return fallback;
  const stripped = v
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return [...stripped].slice(0, max).join("").trim() || fallback;
}

export function validUrl(v, { relative = false } = {}) {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;
  if (relative && (s.startsWith("/") || s.startsWith("./"))) return true;
  if (!/^https?:\/\//i.test(s)) return false;
  if (/[\s"'<>]/.test(s)) return false;
  try {
    const u = new URL(s);
    return (u.protocol === "http:" || u.protocol === "https:") && !!u.hostname;
  } catch {
    return false;
  }
}

export function isTelegramUser(v) {
  return typeof v === "string" && /^[A-Za-z0-9_]{4,32}$/.test(v.trim());
}
export function isUpiId(v) {
  return typeof v === "string" && /^[A-Za-z0-9._-]{2,64}@[A-Za-z][A-Za-z0-9.]{1,32}$/.test(v.trim());
}
export function isEmailAddr(v) {
  return typeof v === "string" && /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{2,64}\.[A-Za-z]{2,16}$/.test(v.trim());
}
export function isRzpId(v) {
  return typeof v === "string" && /^pl_[A-Za-z0-9]{6,32}$/.test(v.trim());
}

export function fingerprint(str) {
  let h = 0x811c9dc5;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/* ─────────────────────────── normalisation core ─────────────────────────── */

/**
 * @param {any} raw
 * @returns {{ config: any, errors: {path:string,message:string}[] }}
 */
export function normalizeConfig(raw) {
  const errors = [];
  const err = (path, message) => errors.push({ path, message });
  const src = isPlainObject(raw) ? raw : {};

  const D = DEFAULT_CONFIG;
  const out = deepClone(D);

  /* ---------- generic field readers ---------- */
  const str = (val, _key, max, fallback, path) => {
    if (val === undefined || val === null || val === "") return fallback;
    if (typeof val !== "string") {
      err(path, "text expected");
      return fallback;
    }
    return cleanText(val, max, fallback);
  };

  const multi = (val, max, fallback, path) => {
    if (val === undefined || val === null || val === "") return fallback;
    if (typeof val !== "string") {
      err(path, "text expected");
      return fallback;
    }
    return cleanMultiline(val, max, fallback);
  };

  const url = (val, fallback, path, opts = {}) => {
    if (val === undefined || val === null || val === "") return fallback;
    if (typeof val !== "string" || !validUrl(val, opts)) {
      err(path, "valid http(s) URL expected");
      return fallback;
    }
    return val.trim();
  };

  const bool = (val, fallback) => (typeof val === "boolean" ? val : fallback);

  const oneOf = (val, list, fallback, path) => {
    if (val === undefined || val === null || val === "") return fallback;
    if (!list.includes(val)) {
      err(path, `expected one of: ${list.join(", ")}`);
      return fallback;
    }
    return val;
  };

  const price = (val, fallback, path) => {
    if (val === undefined || val === null || val === "") return fallback;
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0 || n > 999999) {
      err(path, "price must be 0 – 999999");
      return fallback;
    }
    return Math.round(n);
  };

  const nullablePrice = (val, fallback, path) => {
    if (val === undefined) return fallback;
    if (val === null || val === "") return null;
    return price(val, fallback, path);
  };

  const tri = (val, max, fallback, path) => {
    const fb = isPlainObject(fallback) ? fallback : { en: "", hinglish: "", hi: "" };
    if (val === undefined || val === null) return deepClone(fb);
    if (typeof val === "string") {
      const t = cleanMultiline(val, max);
      return { en: t, hinglish: t, hi: t };
    }
    if (!isPlainObject(val)) {
      err(path, "trilingual text expected");
      return deepClone(fb);
    }
    const res = {};
    for (const lang of LANGS) res[lang] = multi(val[lang], max, fb[lang] || "", `${path}.${lang}`);
    return res;
  };

  const strList = (val, maxItems, maxLen, fallback, path) => {
    if (val === undefined || val === null) return deepClone(fallback);
    if (!Array.isArray(val)) {
      err(path, "array expected");
      return deepClone(fallback);
    }
    return val.slice(0, maxItems).map((x) => cleanText(x, maxLen)).filter(Boolean);
  };

  /* ---------- brand ---------- */
  const b = isPlainObject(src.brand) ? src.brand : {};
  out.brand = {
    name: str(b.name, "name", 60, D.brand.name, "brand.name"),
    shortName: str(b.shortName, "shortName", 60, D.brand.shortName, "brand.shortName"),
    logoUrl: url(b.logoUrl, "", "brand.logoUrl", { relative: true }),
    devName: str(b.devName, "devName", 40, D.brand.devName, "brand.devName"),
    devHandle: str(b.devHandle, "devHandle", 40, D.brand.devHandle, "brand.devHandle"),
    devUrl: url(b.devUrl, D.brand.devUrl, "brand.devUrl"),
    devRole: str(b.devRole, "devRole", 80, D.brand.devRole, "brand.devRole"),
    devBio: multi(b.devBio, 300, D.brand.devBio, "brand.devBio"),
    devTags: strList(b.devTags, 10, 24, D.brand.devTags, "brand.devTags"),
    devStats: Array.isArray(b.devStats)
      ? b.devStats.slice(0, 4).map((s, i) => ({
          value: cleanText(s && s.value, 12, D.brand.devStats[i] ? D.brand.devStats[i].value : ""),
          label: cleanText(s && s.label, 20, D.brand.devStats[i] ? D.brand.devStats[i].label : ""),
        }))
      : deepClone(D.brand.devStats),
  };

  /* ---------- hero ---------- */
  const h = isPlainObject(src.hero) ? src.hero : {};
  out.hero = {
    title: str(h.title, "title", 60, D.hero.title, "hero.title"),
    tagline: str(h.tagline, "tagline", 80, D.hero.tagline, "hero.tagline"),
    badge: str(h.badge, "badge", 60, D.hero.badge, "hero.badge"),
    ctaLabel: str(h.ctaLabel, "ctaLabel", 40, D.hero.ctaLabel, "hero.ctaLabel"),
    image: url(h.image, D.hero.image, "hero.image"),
    sectionLabel: str(h.sectionLabel, "sectionLabel", 50, D.hero.sectionLabel, "hero.sectionLabel"),
    sectionSub: str(h.sectionSub, "sectionSub", 40, D.hero.sectionSub, "hero.sectionSub"),
    faqLabel: str(h.faqLabel, "faqLabel", 40, D.hero.faqLabel, "hero.faqLabel"),
    faqSub: str(h.faqSub, "faqSub", 40, D.hero.faqSub, "hero.faqSub"),
    trust: Array.isArray(h.trust)
      ? h.trust.slice(0, 4).map((t, i) => ({
          icon: oneOf(t && t.icon, TRUST_ICONS, D.hero.trust[i] ? D.hero.trust[i].icon : "star", `hero.trust.${i}.icon`),
          title: cleanText(t && t.title, 24, D.hero.trust[i] ? D.hero.trust[i].title : ""),
          sub: cleanText(t && t.sub, 32, D.hero.trust[i] ? D.hero.trust[i].sub : ""),
        }))
      : deepClone(D.hero.trust),
  };

  /* ---------- announcement ---------- */
  const a = isPlainObject(src.announcement) ? src.announcement : {};
  let expiresAt = null;
  if (a.expiresAt) {
    const t = new Date(a.expiresAt);
    if (Number.isNaN(t.getTime())) err("announcement.expiresAt", "valid date expected");
    else expiresAt = t.toISOString();
  }
  out.announcement = {
    enabled: bool(a.enabled, D.announcement.enabled),
    text: str(a.text, "text", 160, D.announcement.text, "announcement.text"),
    badge: str(a.badge, "badge", 32, D.announcement.badge, "announcement.badge"),
    ctaLabel: str(a.ctaLabel, "ctaLabel", 32, D.announcement.ctaLabel, "announcement.ctaLabel"),
    ctaUrl: url(a.ctaUrl, "", "announcement.ctaUrl", { relative: true }),
    tone: oneOf(a.tone, ANNOUNCE_TONES, D.announcement.tone, "announcement.tone"),
    animation: oneOf(a.animation, ANNOUNCE_ANIMS, D.announcement.animation, "announcement.animation"),
    dismissible: bool(a.dismissible, D.announcement.dismissible),
    expiresAt,
    showOnBuyPage: bool(a.showOnBuyPage, D.announcement.showOnBuyPage),
  };

  /* ---------- packs + plans ---------- */
  out.packs = {};
  const seenIds = new Set();
  for (const key of PACK_KEYS) {
    const Dp = D.packs[key];
    const p = isPlainObject(src.packs) && isPlainObject(src.packs[key]) ? src.packs[key] : {};
    const pack = {
      title: str(p.title, "title", 40, Dp.title, `packs.${key}.title`),
      sub: str(p.sub, "sub", 40, Dp.sub, `packs.${key}.sub`),
      emoji: str(p.emoji, "emoji", 8, Dp.emoji, `packs.${key}.emoji`),
      cta: str(p.cta, "cta", 40, Dp.cta, `packs.${key}.cta`),
      suffix: str(p.suffix, "suffix", 20, Dp.suffix, `packs.${key}.suffix`),
      crown: bool(p.crown, Dp.crown),
      active: bool(p.active, Dp.active),
      plans: [],
    };

    const rawPlans = Array.isArray(p.plans) ? p.plans.slice(0, MAX_PLANS_PER_PACK) : deepClone(Dp.plans);
    rawPlans.forEach((raw, i) => {
      const rp = isPlainObject(raw) ? raw : {};
      const def = Dp.plans[i] || {};
      const name = str(rp.name, "name", 32, def.name || `Plan ${i + 1}`, `packs.${key}.plans.${i}.name`);
      let id = typeof rp.id === "string" && /^[a-z0-9][a-z0-9-]{1,23}$/.test(rp.id) ? rp.id : slug(name) || `${key}-${i + 1}`;
      if (seenIds.has(id)) id = `${id}-${i + 1}`;
      seenIds.add(id);

      const planPrice = price(rp.price, typeof def.price === "number" ? def.price : 0, `packs.${key}.plans.${i}.price`);

      let rzp = "";
      if (rp.razorpayButtonId !== undefined) {
        const cand = typeof rp.razorpayButtonId === "string" ? rp.razorpayButtonId.trim() : "";
        if (!cand) rzp = "";
        else if (isRzpId(cand)) rzp = cand;
        else {
          err(`packs.${key}.plans.${i}.razorpayButtonId`, "expected a pl_xxxxxxxx id or empty");
          rzp = "";
        }
      } else {
        rzp = def.razorpayButtonId || "";
      }

      const plan = {
        id,
        name,
        price: planPrice,
        razorpayButtonId: rzp,
        razorpayAmount: nullablePrice(
          rp.razorpayAmount,
          rzp ? (typeof def.razorpayAmount === "number" ? def.razorpayAmount : null) : null,
          `packs.${key}.plans.${i}.razorpayAmount`
        ),
        payMode: oneOf(rp.payMode, PAY_MODES, "auto", `packs.${key}.plans.${i}.payMode`),
        active: bool(rp.active, def.active !== undefined ? def.active : true),
        soldOut: bool(rp.soldOut, def.soldOut !== undefined ? def.soldOut : false),
        featured: bool(rp.featured, def.featured !== undefined ? def.featured : false),
      };
      if (!plan.razorpayButtonId) plan.razorpayAmount = null;
      pack.plans.push(plan);
    });

    out.packs[key] = pack;
  }

  /* ---------- links ---------- */
  const l = isPlainObject(src.links) ? src.links : {};
  const handle = (val, fallback, path) => {
    if (val === undefined || val === null || val === "") return fallback;
    const clean = String(val).trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
    if (!isTelegramUser(clean)) {
      err(path, "Telegram username expected (4–32 letters, numbers, _)");
      return fallback;
    }
    return clean;
  };
  out.links = {
    upi: (() => {
      if (l.upi === undefined || l.upi === null || l.upi === "") return D.links.upi;
      if (!isUpiId(l.upi)) {
        err("links.upi", "valid UPI id expected (name@bank)");
        return D.links.upi;
      }
      return l.upi.trim();
    })(),
    razorpay: url(l.razorpay, D.links.razorpay, "links.razorpay"),
    telegram: handle(l.telegram, D.links.telegram, "links.telegram"),
    channel: handle(l.channel, D.links.channel, "links.channel"),
    bot: handle(l.bot, D.links.bot, "links.bot"),
    email: (() => {
      if (l.email === undefined || l.email === null || l.email === "") return D.links.email;
      if (!isEmailAddr(l.email)) {
        err("links.email", "valid email expected");
        return D.links.email;
      }
      return l.email.trim();
    })(),
    portfolio: url(l.portfolio, D.links.portfolio, "links.portfolio"),
  };

  /* ---------- content ---------- */
  const c = isPlainObject(src.content) ? src.content : {};
  out.content = {};
  const textFields = {
    payLabel: 40, paymentHeading: 60, upiCaption: 40, upiHint: 300, upiNoteTemplate: 80,
    paymentNoteTitle: 40, paymentNote: 400, screenshotTitle: 60, screenshotDesc: 240,
    screenshotCta: 60, universalLabel: 80, universalCta: 60, buyTitle: 60, buySub: 80,
    proceedLabel: 40, supportPrefix: 80, supportSuffix: 40, footerLine: 90, footerBy: 30,
    footerCredit: 90, telegramEyebrow: 60, telegramTitle: 90, telegramDesc: 160,
    devDrawerTitle: 60, devGuideTitle: 40, infoButton: 24, infoBack: 24, faqViewAll: 40,
    faqTeaserTitle: 60,
  };
  for (const [key, max] of Object.entries(textFields)) {
    out.content[key] = str(c[key], key, max, D.content[key], `content.${key}`);
  }

  /* ---------- info ---------- */
  const inf = isPlainObject(src.info) ? src.info : {};
  out.info = {
    title: tri(inf.title, 120, D.info.title, "info.title"),
    intro: tri(inf.intro, 900, D.info.intro, "info.intro"),
    valueTitle: tri(inf.valueTitle, 80, D.info.valueTitle, "info.valueTitle"),
    whatYouGet: tri(inf.whatYouGet, 90, D.info.whatYouGet, "info.whatYouGet"),
    points: Array.isArray(inf.points)
      ? inf.points.slice(0, 8).map((pt, i) => ({
          icon: oneOf(pt && pt.icon, ["tag", "layer-group", "clapperboard", "bolt", "shield-halved", "headset", "star", "gift", "lock", "wallet"], D.info.points[i] ? D.info.points[i].icon : "star", `info.points.${i}.icon`),
          title: tri(pt && pt.title, 90, D.info.points[i] ? D.info.points[i].title : {}, `info.points.${i}.title`),
          desc: tri(pt && pt.desc, 500, D.info.points[i] ? D.info.points[i].desc : {}, `info.points.${i}.desc`),
        }))
      : deepClone(D.info.points),
    howTitle: tri(inf.howTitle, 80, D.info.howTitle, "info.howTitle"),
    howItWorks: Array.isArray(inf.howItWorks)
      ? inf.howItWorks.slice(0, 6).map((s, i) => ({
          title: tri(s && s.title, 80, D.info.howItWorks[i] ? D.info.howItWorks[i].title : {}, `info.howItWorks.${i}.title`),
          desc: tri(s && s.desc, 300, D.info.howItWorks[i] ? D.info.howItWorks[i].desc : {}, `info.howItWorks.${i}.desc`),
        }))
      : deepClone(D.info.howItWorks),
    policyTitle: tri(inf.policyTitle, 80, D.info.policyTitle, "info.policyTitle"),
    policies: Array.isArray(inf.policies)
      ? inf.policies.slice(0, 6).map((s, i) => ({
          title: tri(s && s.title, 80, D.info.policies[i] ? D.info.policies[i].title : {}, `info.policies.${i}.title`),
          desc: tri(s && s.desc, 500, D.info.policies[i] ? D.info.policies[i].desc : {}, `info.policies.${i}.desc`),
        }))
      : deepClone(D.info.policies),
    supportNote: tri(inf.supportNote, 300, D.info.supportNote, "info.supportNote"),
  };

  /* ---------- faq ---------- */
  const faqIds = new Set();
  out.faq = (Array.isArray(src.faq) ? src.faq : deepClone(D.faq)).slice(0, MAX_FAQ).map((item, i) => {
    const it = isPlainObject(item) ? item : {};
    const fallbackItem = D.faq[i] || { q: {}, a: {} };
    let id = typeof it.id === "string" && /^[a-z0-9][a-z0-9-]{1,31}$/.test(it.id) ? it.id : `faq-${i + 1}`;
    if (faqIds.has(id)) id = `${id}-${i + 1}`;
    faqIds.add(id);
    return {
      id,
      cat: oneOf(it.cat, FAQ_CATS, "support", `faq.${i}.cat`),
      active: bool(it.active, true),
      q: tri(it.q, 160, fallbackItem.q || {}, `faq.${i}.q`),
      a: tri(it.a, 900, fallbackItem.a || {}, `faq.${i}.a`),
    };
  });

  /* ---------- appearance ---------- */
  const ap = isPlainObject(src.appearance) ? src.appearance : {};
  out.appearance = {
    defaultTheme: oneOf(ap.defaultTheme, THEME_IDS, D.appearance.defaultTheme, "appearance.defaultTheme"),
    darkTheme: oneOf(ap.darkTheme, DARK_THEMES, D.appearance.darkTheme, "appearance.darkTheme"),
  };

  /* ---------- meta ---------- */
  const rev = Number(src.revision);
  out.v = CONFIG_VERSION;
  out.revision = Number.isFinite(rev) && rev >= 0 ? Math.floor(rev) : 0;
  out.updatedAt = typeof src.updatedAt === "string" && !Number.isNaN(Date.parse(src.updatedAt)) ? new Date(src.updatedAt).toISOString() : null;
  if (typeof src.restoredFrom !== "undefined" && src.restoredFrom !== null) {
    const rf = Number(src.restoredFrom);
    if (Number.isFinite(rf)) out.restoredFrom = Math.floor(rf);
  }

  return { config: out, errors };
}

/**
 * Old KV documents ({pricing, site}) → v2 shape.
 * Also accepts already-v2 documents untouched.
 */
export function migrateLegacy(raw) {
  const D = DEFAULT_CONFIG;
  if (!isPlainObject(raw)) return null;
  if (Number(raw.v) >= 2) return raw;
  if (!isPlainObject(raw.pricing) && !isPlainObject(raw.site)) return raw;

  const cfg = deepClone(D);
  if (isPlainObject(raw.pricing)) {
    for (const key of PACK_KEYS) {
      const p = raw.pricing[key];
      if (!p || !Array.isArray(p.plans)) continue;
      cfg.packs[key].plans = p.plans.slice(0, MAX_PLANS_PER_PACK).map((x, i) => {
        const def = D.packs[key].plans[i] || {};
        const b = typeof x.b === "string" ? x.b.trim() : "";
        return {
          id: `${key}-${i + 1}`,
          name: typeof x.n === "string" && x.n.trim() ? x.n.trim() : def.name || `Plan ${i + 1}`,
          price: typeof x.p === "number" ? x.p : def.price || 0,
          razorpayButtonId: b,
          razorpayAmount: b && def.razorpayButtonId === b ? def.razorpayAmount : null,
          payMode: "auto",
          active: true,
          soldOut: false,
          featured: !!def.featured,
        };
      });
    }
  }
  if (isPlainObject(raw.site)) {
    const s = raw.site;
    if (typeof s.upi === "string" && s.upi.trim()) cfg.links.upi = s.upi.trim();
    if (typeof s.razorpay === "string" && s.razorpay.trim()) cfg.links.razorpay = s.razorpay.trim();
    if (typeof s.telegram === "string" && s.telegram.trim()) cfg.links.telegram = s.telegram.trim().replace(/^@/, "");
    if (typeof s.channel === "string" && s.channel.trim()) cfg.links.channel = s.channel.trim().replace(/^@/, "");
    if (typeof s.bot === "string" && s.bot.trim()) cfg.links.bot = s.bot.trim().replace(/^@/, "");
    if (typeof s.email === "string" && s.email.trim()) cfg.links.email = s.email.trim();
    if (typeof s.tagline === "string" && s.tagline.trim()) cfg.hero.tagline = s.tagline.trim();
  }
  if (typeof raw.updatedAt === "string") cfg.updatedAt = raw.updatedAt;
  cfg.migratedFrom = "v1";
  return cfg;
}

export function normalizeAny(raw) {
  return normalizeConfig(migrateLegacy(raw));
}

/** human readable list of what changed between two configs */
export function summarizeChanges(prev, next) {
  const sections = ["brand", "hero", "announcement", "packs", "links", "content", "info", "faq", "appearance"];
  const changed = [];
  for (const s of sections) {
    if (JSON.stringify(prev ? prev[s] : null) !== JSON.stringify(next ? next[s] : null)) changed.push(s);
  }
  const priceChanges = [];
  if (prev && next && prev.packs && next.packs) {
    for (const k of PACK_KEYS) {
      const before = prev.packs[k] && prev.packs[k].plans ? prev.packs[k].plans : [];
      const after = next.packs[k] && next.packs[k].plans ? next.packs[k].plans : [];
      after.forEach((plan, i) => {
        const old = before[i];
        if (old && old.price !== plan.price) priceChanges.push(`${plan.name}: ₹${old.price} → ₹${plan.price}`);
      });
    }
  }
  return { sections: changed, prices: priceChanges };
}

/** runtime shape guards used by the browser mirror */
export function ensureConfig(raw) {
  const { config, errors } = normalizeAny(raw);
  return { config, errors };
}
