import type { Config, Pack, PackKey, Plan } from "@/types";

export type PayDecision = "razorpay" | "upi";

export interface PlanPayment {
  mode: "razorpay" | "upi";
  razorpayButtonId: string;
  amount: number;
  mismatch: boolean;
  reason: string;
}

/**
 * Razorpay Payment Buttons have a FIXED amount. If the stored button amount
 * does not match the plan price we must not send the customer there — the
 * UPI deep link is amount-accurate, so it wins automatically.
 */
export function resolvePayment(plan: Plan): PlanPayment {
  const hasButton = !!plan.razorpayButtonId;
  const mismatch = hasButton && plan.razorpayAmount != null && plan.razorpayAmount !== plan.price;

  if (plan.payMode === "upi" || plan.payMode === "universal") {
    return { mode: "upi", razorpayButtonId: "", amount: plan.price, mismatch, reason: plan.payMode };
  }
  if (plan.payMode === "razorpay") {
    return {
      mode: hasButton && !mismatch ? "razorpay" : "upi",
      razorpayButtonId: hasButton && !mismatch ? plan.razorpayButtonId : "",
      amount: plan.price,
      mismatch,
      reason: mismatch ? "amount-mismatch" : hasButton ? "forced-razorpay" : "no-button"
    };
  }
  // auto
  if (hasButton && !mismatch) {
    return { mode: "razorpay", razorpayButtonId: plan.razorpayButtonId, amount: plan.price, mismatch: false, reason: "auto" };
  }
  return {
    mode: "upi",
    razorpayButtonId: "",
    amount: plan.price,
    mismatch,
    reason: mismatch ? "amount-mismatch" : "no-button"
  };
}

export function applyTemplate(template: string, vars: Record<string, string | number>): string {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : ""));
}

export function buildUpiUri(cfg: Config, planName: string, packKey: PackKey, amount: number): string {
  const note = applyTemplate(cfg.content.upiNoteTemplate, {
    plan: planName,
    pack: cfg.packs[packKey]?.title || packKey,
    bot: cfg.links.bot,
    brand: cfg.brand.name
  });
  const params = new URLSearchParams({
    pa: cfg.links.upi,
    pn: cfg.brand.shortName || cfg.brand.name,
    am: Number(amount || 0).toFixed(2),
    cu: "INR",
    tn: note
  });
  return `upi://pay?${params.toString()}`;
}

export function qrSrc(data: string, size = 520): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(data)}`;
}

export function telegramUrl(handle: string): string {
  return `https://t.me/${String(handle || "").replace(/^@/, "")}`;
}

export function screenshotMessageUrl(cfg: Config, pack: Pack, plan: Plan, amount: number): string {
  const lines = [
    "Jai Shree Ram Bhai! Payment Ho Gayi Hai.",
    `Plan: ${pack.title} · ${plan.name} (₹${amount})`,
    "Payment Screenshot Bhej Raha Hoon.",
    `Tracker: @${cfg.links.bot}`,
    "Please verify karke channel/access de dena. 🙏"
  ];
  return `${telegramUrl(cfg.links.telegram)}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function activePlans(pack: Pack): Plan[] {
  return (pack.plans || []).filter((p) => p.active);
}

export function visiblePacks(cfg: Config): PackKey[] {
  return (Object.keys(cfg.packs) as PackKey[]).filter((k) => cfg.packs[k] && cfg.packs[k].active);
}

export function lowestPrice(pack: Pack): number {
  const list = activePlans(pack).map((p) => p.price);
  return list.length ? Math.min(...list) : 0;
}

/** featured plan else cheapest per month — same logic as the original site */
export function isBestValue(plan: Plan, plans: Plan[]): boolean {
  if (plan.featured) return true;
  if (plans.some((p) => p.featured)) return false;
  const months = (name: string) => {
    const n = parseInt(name, 10) || 1;
    return /year/i.test(name) ? n * 12 : /month/i.test(name) ? n * 1 : n;
  };
  const costs = plans.map((p) => p.price / Math.max(1, months(p.name)));
  const min = Math.min(...costs);
  return plan.price / Math.max(1, months(plan.name)) <= min + 0.01;
}
