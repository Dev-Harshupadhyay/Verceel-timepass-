import { describe, expect, it } from "vitest";
import {
  resolvePayment,
  buildUpiUri,
  screenshotMessageUrl,
  telegramUrl,
  activePlans,
  lowestPrice,
  isBestValue,
  applyTemplate
} from "@/lib/payments";
import { DEFAULT_CONFIG } from "@/config";
import type { Config, Plan } from "@/types";

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "p1",
    name: "1 Month",
    price: 50,
    razorpayButtonId: "pl_TcjHF0nZXCtlQO",
    razorpayAmount: 50,
    payMode: "auto",
    active: true,
    soldOut: false,
    featured: false,
    ...overrides
  };
}

function cfg(): Config {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

describe("razorpay / upi routing", () => {
  it("keeps a matching button on razorpay (today's behaviour)", () => {
    const d = resolvePayment(plan());
    expect(d.mode).toBe("razorpay");
    expect(d.razorpayButtonId).toBe("pl_TcjHF0nZXCtlQO");
    expect(d.mismatch).toBe(false);
  });

  it("falls back to UPI when the fixed button amount no longer matches", () => {
    const d = resolvePayment(plan({ price: 100, razorpayAmount: 70 }));
    expect(d.mode).toBe("upi");
    expect(d.mismatch).toBe(true);
    expect(d.razorpayButtonId).toBe("");
  });

  it("uses UPI when there is no button at all", () => {
    const d = resolvePayment(plan({ razorpayButtonId: "", razorpayAmount: null }));
    expect(d.mode).toBe("upi");
    expect(d.reason).toBe("no-button");
  });

  it("honours an explicit UPI / universal mode", () => {
    expect(resolvePayment(plan({ payMode: "upi" })).mode).toBe("upi");
    expect(resolvePayment(plan({ payMode: "universal" })).mode).toBe("upi");
  });

  it("never sends a mismatched amount to razorpay even when forced", () => {
    const d = resolvePayment(plan({ payMode: "razorpay", price: 99, razorpayAmount: 50 }));
    expect(d.mode).toBe("upi");
  });

  it("does not treat an unknown button amount as a mismatch", () => {
    const d = resolvePayment(plan({ razorpayAmount: null }));
    expect(d.mode).toBe("razorpay");
  });
});

describe("links built from config", () => {
  it("builds the UPI deep link with the configured id and note", () => {
    const c = cfg();
    c.links.upi = "someone@okaxis";
    c.links.bot = "MyBot";
    const uri = buildUpiUri(c, "6 Months", "combo", 780);
    expect(uri.startsWith("upi://pay?")).toBe(true);
    expect(uri).toContain("pa=someone%40okaxis");
    expect(uri).toContain("am=780.00");
    expect(uri).toContain("cu=INR");
    expect(decodeURIComponent(uri)).toContain("MyBot");
  });

  it("changes when the admin changes the UPI id", () => {
    const c = cfg();
    const before = buildUpiUri(c, "1 Month", "movies", 50);
    c.links.upi = "new@upi";
    const after = buildUpiUri(c, "1 Month", "movies", 50);
    expect(before).not.toBe(after);
    expect(after).toContain("new%40upi");
  });

  it("builds the telegram screenshot DM from config", () => {
    const c = cfg();
    c.links.telegram = "supportguy";
    c.links.bot = "TrackerBot9";
    const url = screenshotMessageUrl(c, c.packs.movies, c.packs.movies.plans[0], 50);
    expect(url.startsWith("https://t.me/supportguy?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("@TrackerBot9");
  });

  it("strips a leading @ from handles", () => {
    expect(telegramUrl("@pmharsh")).toBe("https://t.me/pmharsh");
  });

  it("applies template variables", () => {
    expect(applyTemplate("Premium {plan} @{bot}", { plan: "1 Month", bot: "x" })).toBe("Premium 1 Month @x");
    expect(applyTemplate("{missing}", {})).toBe("");
  });
});

describe("plan helpers", () => {
  it("filters hidden plans and finds the lowest live price", () => {
    const c = cfg();
    c.packs.movies.plans[0].active = false;
    expect(activePlans(c.packs.movies).length).toBe(3);
    expect(lowestPrice(c.packs.movies)).toBe(250);
  });

  it("prefers the featured plan as best value", () => {
    const plans = cfg().packs.movies.plans;
    const featured = plans.find((p) => p.featured) as Plan;
    expect(isBestValue(featured, plans)).toBe(true);
    expect(isBestValue(plans[0], plans)).toBe(false);
  });
});
