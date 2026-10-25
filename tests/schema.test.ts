import { describe, expect, it } from "vitest";
import {
  normalizeConfig,
  normalizeAny,
  migrateLegacy,
  summarizeChanges,
  isUpiId,
  isRzpId,
  isTelegramUser,
  validUrl,
  cleanText
} from "../api/_lib/config-schema.js";
import { DEFAULT_CONFIG } from "../api/_lib/defaults.js";

describe("defaults", () => {
  it("keeps the exact original prices", () => {
    const prices = (key: "movies" | "adult" | "combo") => DEFAULT_CONFIG.packs[key].plans.map((p: any) => p.price);
    expect(prices("movies")).toEqual([50, 250, 420, 465]);
    expect(prices("adult")).toEqual([100, 400, 580, 835]);
    expect(prices("combo")).toEqual([250, 520, 780, 1500]);
  });

  it("keeps the working razorpay button ids", () => {
    expect(DEFAULT_CONFIG.packs.movies.plans[0].razorpayButtonId).toBe("pl_TcjHF0nZXCtlQO");
    expect(DEFAULT_CONFIG.packs.movies.plans[3].razorpayButtonId).toBe("pl_TcjSAK86Q3OvuC");
    expect(DEFAULT_CONFIG.packs.adult.plans[3].razorpayButtonId).toBe("pl_TcjW9QKyHKuxPG");
    expect(DEFAULT_CONFIG.packs.adult.plans[0].razorpayButtonId).toBe("");
  });

  it("has the original links + gold default", () => {
    expect(DEFAULT_CONFIG.links.telegram).toBe("pmharsh");
    expect(DEFAULT_CONFIG.links.bot).toBe("Trackerhhbot");
    expect(DEFAULT_CONFIG.links.channel).toBe("TIMEPASS_BACKUP_1");
    expect(DEFAULT_CONFIG.appearance.defaultTheme).toBe("obsidian");
    expect(DEFAULT_CONFIG.appearance.darkTheme).toBe("obsidian");
  });

  it("ships trilingual FAQ content", () => {
    expect(DEFAULT_CONFIG.faq.length).toBeGreaterThanOrEqual(10);
    for (const item of DEFAULT_CONFIG.faq) {
      expect(item.q.en.length).toBeGreaterThan(3);
      expect(item.q.hinglish.length).toBeGreaterThan(3);
      expect(item.q.hi.length).toBeGreaterThan(3);
      expect(item.a.en.length).toBeGreaterThan(10);
    }
  });

  it("ships trilingual info content", () => {
    expect(DEFAULT_CONFIG.info.points.length).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_CONFIG.info.intro.hinglish.length).toBeGreaterThan(50);
    expect(DEFAULT_CONFIG.info.intro.hi.length).toBeGreaterThan(20);
  });
});

describe("normalizeConfig", () => {
  it("accepts the defaults without errors", () => {
    const { config, errors } = normalizeConfig(DEFAULT_CONFIG);
    expect(errors).toEqual([]);
    expect(config.packs.movies.plans[0].price).toBe(50);
  });

  it("strips HTML from user text", () => {
    const { config } = normalizeConfig({
      ...DEFAULT_CONFIG,
      hero: { ...DEFAULT_CONFIG.hero, title: '<img src=x onerror="alert(1)">Hello' }
    });
    expect(config.hero.title).not.toContain("<");
    expect(config.hero.title).toContain("Hello");
  });

  it("rejects javascript: urls and falls back", () => {
    const { config, errors } = normalizeConfig({
      ...DEFAULT_CONFIG,
      hero: { ...DEFAULT_CONFIG.hero, image: "javascript:alert(1)" }
    });
    expect(config.hero.image).toBe(DEFAULT_CONFIG.hero.image);
    expect(errors.some((e: any) => e.path === "hero.image")).toBe(true);
  });

  it("clamps prices and reports out-of-range values", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.packs.movies.plans[0].price = 9_999_999;
    const { errors } = normalizeConfig(cfg);
    expect(errors.some((e: any) => e.path.includes("price"))).toBe(true);
  });

  it("drops invalid razorpay ids", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.packs.movies.plans[0].razorpayButtonId = "javascript:alert(1)";
    const { config, errors } = normalizeConfig(cfg);
    expect(config.packs.movies.plans[0].razorpayButtonId).toBe("");
    expect(errors.length).toBeGreaterThan(0);
  });

  it("validates telegram handles, upi ids and emails", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.links.telegram = "bad handle!";
    cfg.links.upi = "not-a-vpa";
    cfg.links.email = "nope";
    const { errors } = normalizeConfig(cfg);
    const paths = errors.map((e: any) => e.path);
    expect(paths).toContain("links.telegram");
    expect(paths).toContain("links.upi");
    expect(paths).toContain("links.email");
  });

  it("dedupes plan ids and caps plan count", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.packs.movies.plans = Array.from({ length: 9 }, (_, i) => ({ ...cfg.packs.movies.plans[0], id: "same" }));
    const { config } = normalizeConfig(cfg);
    expect(config.packs.movies.plans.length).toBeLessThanOrEqual(6);
    const ids = config.packs.movies.plans.map((p: any) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("accepts a single string for trilingual fields (uses it for all 3)", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.faq[0].q = "Sirf ek language";
    const { config } = normalizeConfig(cfg);
    expect(config.faq[0].q.en).toBe("Sirf ek language");
    expect(config.faq[0].q.hi).toBe("Sirf ek language");
  });

  it("rejects unknown theme ids", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.appearance.defaultTheme = "super-neon";
    const { config } = normalizeConfig(cfg);
    expect(config.appearance.defaultTheme).toBe("obsidian");
  });

  it("migrates a removed apple-light default to gold", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.appearance.defaultTheme = "apple-light";
    const { config, errors } = normalizeConfig(cfg);
    expect(config.appearance.defaultTheme).toBe("obsidian");
    expect(errors.length).toBe(0);
  });

  it("keeps pearl as the light theme", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.appearance.defaultTheme = "pearl";
    const { config } = normalizeConfig(cfg);
    expect(config.appearance.defaultTheme).toBe("pearl");
  });

  it("limits announcement text length", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.announcement.enabled = true;
    cfg.announcement.text = "x".repeat(500);
    const { config } = normalizeConfig(cfg);
    expect(config.announcement.text.length).toBeLessThanOrEqual(160);
  });
});

describe("legacy migration", () => {
  it("migrates the old {pricing, site} document", () => {
    const legacy = {
      pricing: {
        movies: { plans: [{ n: "1 Month", p: 60, b: "pl_TcjHF0nZXCtlQO" }] },
        adult: { plans: [{ n: "1 Month", p: 120, b: "" }] }
      },
      site: { upi: "someone@okaxis", tagline: "Naya tagline", telegram: "@newhandle" },
      updatedAt: "2026-01-01T00:00:00.000Z"
    };
    const migrated = normalizeAny(legacy).config;
    expect(migrated.v).toBe(2);
    expect(migrated.packs.movies.plans[0].price).toBe(60);
    expect(migrated.packs.adult.plans[0].price).toBe(120);
    expect(migrated.links.upi).toBe("someone@okaxis");
    expect(migrated.hero.tagline).toBe("Naya tagline");
    expect(migrated.links.telegram).toBe("newhandle");
  });

  it("keeps v2 documents untouched", () => {
    const once = normalizeConfig(DEFAULT_CONFIG).config;
    const migrated = migrateLegacy(once);
    expect(migrated.v).toBe(2);
  });
});

describe("helpers", () => {
  it("validates formats", () => {
    expect(isUpiId("pmharsh@fam")).toBe(true);
    expect(isUpiId("nope")).toBe(false);
    expect(isRzpId("pl_TcjHF0nZXCtlQO")).toBe(true);
    expect(isRzpId("pl_123")).toBe(false);
    expect(isTelegramUser("Trackerhhbot")).toBe(true);
    expect(isTelegramUser("a b")).toBe(false);
    expect(validUrl("https://example.com")).toBe(true);
    expect(validUrl("javascript:alert(1)")).toBe(false);
    expect(validUrl("/logo.svg", { relative: true })).toBe(true);
  });

  it("cleans text", () => {
    expect(cleanText("  a <b> b  ", 30)).toBe("a b b");
    expect(cleanText("x".repeat(80), 10).length).toBe(10);
  });

  it("summarizes changes", () => {
    const a = normalizeConfig(DEFAULT_CONFIG).config;
    const b = JSON.parse(JSON.stringify(a));
    b.packs.movies.plans[0].price = 55;
    b.hero.tagline = "New";
    const summary = summarizeChanges(a, b);
    expect(summary.sections).toContain("packs");
    expect(summary.sections).toContain("hero");
    expect(summary.prices[0]).toContain("₹50 → ₹55");
  });
});

describe("plan stickers", () => {
  it("keeps a plain emoji", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.packs.movies.plans[0].sticker = "🔥";
    const { config, errors } = normalizeConfig(cfg);
    expect(errors.length).toBe(0);
    expect(config.packs.movies.plans[0].sticker).toBe("🔥");
  });

  it("lets the admin clear a sticker", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.packs.movies.plans[0].sticker = "";
    const { config, errors } = normalizeConfig(cfg);
    expect(errors.length).toBe(0);
    expect(config.packs.movies.plans[0].sticker).toBe("");
  });

  it("falls back to the seeded sticker when the field is absent", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    delete cfg.packs.movies.plans[2].sticker;
    const { config } = normalizeConfig(cfg);
    expect(config.packs.movies.plans[2].sticker).toBe("🔥");
  });

  it("caps length and strips markup", () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.packs.movies.plans[0].sticker = "<b>★★★★★★★★★★</b>";
    const { config } = normalizeConfig(cfg);
    expect(config.packs.movies.plans[0].sticker.length).toBeLessThanOrEqual(8);
    expect(config.packs.movies.plans[0].sticker).not.toContain("<");
  });
});
